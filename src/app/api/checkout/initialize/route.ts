// src/app/api/checkout/initialize/route.ts
// v3 — Guest checkout. Paystack only.
// POST { rateId, notes, email, address:{ fullName, phone, addressLine1, addressLine2,
//        city, state, stateCode?, country, countryCode?, postalCode? } }
//
// No sign-in required. If the shopper is logged in we use their profile; if not,
// we upsert a lightweight guest Profile keyed to their email (industry-standard
// guest checkout) — so orders always attach to a profile with NO schema change.
// The cart is read by profileId (logged in) or the tv_session cookie (guest).

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";
import { resolveShipping } from "@/lib/shipping";
import crypto from "crypto";

const TERMINAL_BASE = "https://api.terminal.africa/v1";

function getSessionId(req: NextRequest) {
  return req.cookies.get("tv_session")?.value ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rateId, notes, address } = body;
    const email: string | undefined = (body.email ?? address?.email)?.trim()?.toLowerCase();

    // ── Validate ──
    if (!address?.fullName || !address?.phone || !address?.addressLine1 ||
        !address?.city || !address?.state || !address?.country) {
      return NextResponse.json({ success: false, error: "Incomplete delivery details" }, { status: 400 });
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "A valid email is required" }, { status: 400 });
    }

    // ── Identify the shopper: logged in, or guest (by email) ──
    const user = await getServerUser();
    const sessionId = getSessionId(req);

    let profileId: string;
    if (user) {
      profileId = user.id;
      // keep guest email in sync isn't needed; logged-in profile already exists
    } else {
      // Guest checkout — never blocks on sign-in. Reuse an existing GUEST
      // profile with this email if one exists (so a repeat guest shopper's
      // orders land on one profile), but never touch a real registered
      // account: that would let anyone attach orders/addresses to a
      // stranger's account just by typing their email, with no proof of
      // ownership.
      const existingGuest = await prisma.profile.findFirst({
        where: { email, id: { startsWith: "guest_" } },
      });
      if (existingGuest) {
        profileId = existingGuest.id;
      } else {
        const guest = await prisma.profile.create({
          data: {
            id: `guest_${crypto.randomUUID()}`,
            email,
            fullName: address.fullName,
            phone: address.phone,
            role: "CUSTOMER",
          },
        });
        profileId = guest.id;
      }
    }

    // ── Read the cart (logged in → profileId, guest → sessionId) ──
    const cartWhere = user
      ? { profileId: user.id }
      : sessionId
      ? { sessionId }
      : null;
    if (!cartWhere) {
      return NextResponse.json({ success: false, error: "Your bag is empty" }, { status: 400 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: cartWhere,
      include: {
        product: { select: { name: true, basePrice: true } },
        variant: { select: { priceOverride: true } },
      },
    });
    if (!cartItems.length) {
      return NextResponse.json({ success: false, error: "Your bag is empty" }, { status: 400 });
    }

    // ── Totals ──
    const subtotal = cartItems.reduce(
      (sum, i) => sum + Number(i.variant.priceOverride ?? i.product.basePrice) * i.quantity, 0,
    );

    // ── Re-validate the shipping rate server-side. Fails closed: an invalid,
    // expired, or unverifiable rate blocks checkout rather than silently
    // charging ₦0 shipping. ──
    if (!rateId) {
      return NextResponse.json({ success: false, error: "Please select a shipping option" }, { status: 400 });
    }
    let shippingFee: number;
    let shippingCarrier = "";

    const flatMatch = resolveShipping(rateId, address.country.trim(), address.state, subtotal);
    if (flatMatch) {
      // Flat-zone fallback rate — the fee is recomputed locally, not from Terminal.
      shippingFee = flatMatch.feeNGN;
      shippingCarrier = flatMatch.label;
    } else {
      try {
        const rateRes = await fetch(`${TERMINAL_BASE}/rates/${encodeURIComponent(rateId)}`, {
          headers: { Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}` },
          cache: "no-store",
        });
        const rateData = await rateRes.json();
        if (!rateRes.ok || !rateData?.data || !Number.isFinite(Number(rateData.data.amount))) {
          return NextResponse.json(
            { success: false, error: "Shipping rate expired — please fetch rates again" },
            { status: 422 },
          );
        }
        shippingFee = Number(rateData.data.amount);
        shippingCarrier = rateData.data.carrier_name ?? "";
      } catch {
        return NextResponse.json(
          { success: false, error: "Could not verify shipping rate — please try again" },
          { status: 502 },
        );
      }
    }

    const totalAmount = subtotal + shippingFee;

    // ── Create the delivery address (attached to the profile) ──
    const createdAddress = await prisma.address.create({
      data: {
        profileId,
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || null,
        city: address.city,
        state: address.state,
        country: address.country.trim(),  // saves the SELECTED country (no hardcode)
        postalCode: address.postalCode || null,
      },
    });

    // ── Create the order ──
    const order = await prisma.order.create({
      data: {
        profileId,
        addressId: createdAddress.id,
        status: "PENDING",
        totalAmount,
        currency: "NGN",
        paymentProvider: "PAYSTACK",
        paymentStatus: "PENDING",
        notes: [
          notes,
          shippingCarrier && `Shipping: ${shippingCarrier} (${shippingFee})`,
          rateId && `[rate:${rateId}]`,
        ].filter(Boolean).join(" "),
        items: {
          create: cartItems.map((i) => {
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

    // ── Initialize Paystack (reference = order.id, so verify can find it) ──
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(totalAmount * 100), // kobo
        reference: order.id,
        callback_url: `${origin}/checkout/confirm?reference=${order.id}`,
        metadata: { orderId: order.id },
      }),
    });
    const paystackData = await paystackRes.json();

    if (!paystackData?.status || !paystackData?.data?.authorization_url) {
      // Roll back the pending order if Paystack init failed.
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED", status: "CANCELLED" },
      }).catch(() => {});
      return NextResponse.json(
        { success: false, error: paystackData?.message ?? "Could not start payment" },
        { status: 502 },
      );
    }

    // Clear the cart now that the order exists.
    await prisma.cartItem.deleteMany({ where: cartWhere }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: { paymentUrl: paystackData.data.authorization_url, orderId: order.id },
    });
  } catch (e) {
    console.error("checkout/initialize:", e);
    return NextResponse.json({ success: false, error: "Could not start checkout" }, { status: 500 });
  }
}
