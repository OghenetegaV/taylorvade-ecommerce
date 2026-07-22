// src/app/api/checkout/initialize/route.ts
// v2 — Paystack only. POST { rateId, notes, address:{...} }
// Re-validates the Terminal Africa rate server-side (GET /rates/:id) so the
// delivery fee can't be tampered with, creates the Address + PENDING Order,
// then returns the Paystack hosted-payment URL.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";

const TERMINAL_BASE = "https://api.terminal.africa/v1";

type Body = {
  rateId: string;
  notes?: string;
  address: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Please sign in to check out" }, { status: 401 });
    }

    const { rateId, notes, address } = (await req.json()) as Body;

    if (!rateId) {
      return NextResponse.json({ success: false, error: "Please select a shipping option" }, { status: 400 });
    }
    const required: (keyof Body["address"])[] = ["fullName", "phone", "addressLine1", "city", "state", "country"];
    for (const f of required) {
      if (!address?.[f]?.trim()) {
        return NextResponse.json({ success: false, error: `Missing address field: ${f}` }, { status: 400 });
      }
    }

    // ── Cart from DB (source of truth) ───────────────────────────
    const cartItems = await prisma.cartItem.findMany({
      where: { profileId: user.id },
      include: {
        product: { select: { id: true, name: true, basePrice: true, isPublished: true } },
        variant: true,
      },
    });
    if (!cartItems.length) {
      return NextResponse.json({ success: false, error: "Your bag is empty" }, { status: 400 });
    }

    let subtotal = 0;
    for (const item of cartItems) {
      if (!item.product.isPublished) {
        return NextResponse.json(
          { success: false, error: `${item.product.name} is no longer available` }, { status: 409 });
      }
      if (item.variant.stockQuantity < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Only ${item.variant.stockQuantity} left of ${item.product.name} (${item.variant.size})` },
          { status: 409 });
      }
      subtotal += Number(item.variant.priceOverride ?? item.product.basePrice) * item.quantity;
    }

    // ── Re-validate the Terminal rate server-side ────────────────
    const rateRes = await fetch(`${TERMINAL_BASE}/rates/${encodeURIComponent(rateId)}`, {
      headers: { Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}` },
    });
    const rateData = await rateRes.json();
    const rate = rateData?.data;
    if (!rateRes.ok || !rate || !Number.isFinite(Number(rate.amount))) {
      return NextResponse.json(
        { success: false, error: "Shipping rate expired — please fetch rates again" },
        { status: 422 },
      );
    }
    const shippingFee = Number(rate.amount);
    const carrier     = rate.carrier_name ?? "Courier";
    const eta         = rate.delivery_time ?? "";
    const total       = subtotal + shippingFee;

    // ── Persist address + order ──────────────────────────────────
    const profile = await prisma.profile.findUnique({ where: { id: user.id } });

    const savedAddress = await prisma.address.create({
      data: {
        profileId: user.id,
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        addressLine1: address.addressLine1.trim(),
        addressLine2: address.addressLine2?.trim() || null,
        city: address.city.trim(),
        state: address.state.trim(),
        country: address.country.trim(),
        postalCode: address.postalCode?.trim() || null,
      },
    });

    const order = await prisma.order.create({
      data: {
        profileId: user.id,
        addressId: savedAddress.id,
        totalAmount: total,
        currency: "NGN",
        paymentProvider: "PAYSTACK",
        paymentStatus: "PENDING",
        notes: [
          `Shipping: ${carrier}${eta ? ` (${eta})` : ""} — ₦${shippingFee.toLocaleString()} [rate:${rateId}]`,
          notes?.trim(),
        ].filter(Boolean).join(" | "),
        items: {
          create: cartItems.map(i => {
            const unit = Number(i.variant.priceOverride ?? i.product.basePrice);
            return {
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              unitPrice: unit,
              total: unit * i.quantity,
            };
          }),
        },
      },
    });

    // ── Paystack ─────────────────────────────────────────────────
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: profile?.email ?? user.email,
        amount: Math.round(total * 100),  // kobo
        reference: order.id,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/confirm?reference=${order.id}`,
        channels: ["card", "bank", "ussd", "bank_transfer"],
        metadata: {
          order_id: order.id,
          user_id: user.id,
          customer_name: address.fullName,
          shipping_carrier: carrier,
        },
      }),
    });
    const data = await res.json();
    if (!data.status) {
      await prisma.order.delete({ where: { id: order.id } });
      return NextResponse.json({ success: false, error: data.message ?? "Paystack initialization failed" }, { status: 502 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentReference: order.id },
    });

    return NextResponse.json({
      success: true,
      data: { paymentUrl: data.data.authorization_url, orderId: order.id, total },
    });
  } catch (e) {
    console.error("checkout/initialize:", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Checkout initialization failed" },
      { status: 500 },
    );
  }
}
