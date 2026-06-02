// src/app/api/payments/flutterwave/initialize/route.ts
// POST /api/payments/flutterwave/initialize
// For international payments — GBP, USD, EUR

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY!;
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL!;

// Exchange rate placeholder — in production, fetch from a live FX API
// e.g. https://api.exchangerate-api.com
const EXCHANGE_RATES: Record<string, number> = {
  NGN: 1,
  USD: 0.00065,  // approximate — always use live rates in production
  GBP: 0.00052,
  EUR: 0.00060,
};

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { addressId, currency = "USD", notes } = body;

    if (!addressId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Delivery address is required" },
        { status: 400 }
      );
    }

    if (!["USD", "GBP", "EUR", "NGN"].includes(currency)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unsupported currency" },
        { status: 400 }
      );
    }

    const address = await prisma.address.findFirst({
      where: { id: addressId, profileId: user.id },
    });

    if (!address) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { profileId: user.id },
      include: {
        product: { select: { id: true, name: true, basePrice: true } },
        variant: {
          select: {
            id: true,
            priceOverride: true,
            stockQuantity: true,
            sku: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Your cart is empty" },
        { status: 400 }
      );
    }

    // ── Validate stock and compute total in NGN ───────────────────────
    let totalNGN = 0;

    for (const item of cartItems) {
      if (item.variant.stockQuantity < item.quantity) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Insufficient stock for ${item.product.name}`,
          },
          { status: 409 }
        );
      }
      const price = Number(item.variant.priceOverride ?? item.product.basePrice);
      totalNGN += price * item.quantity;
    }

    // ── Convert to requested currency ─────────────────────────────────
    const rate = EXCHANGE_RATES[currency] ?? 1;
    const totalInCurrency = parseFloat((totalNGN * rate).toFixed(2));

    const profile = await prisma.profile.findUnique({ where: { id: user.id } });

    // ── Create pending order ──────────────────────────────────────────
    const order = await prisma.order.create({
      data: {
        profileId: user.id,
        addressId,
        totalAmount: totalNGN,       // always store in NGN internally
        currency,
        paymentProvider: "FLUTTERWAVE",
        paymentStatus: "PENDING",
        notes,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: Number(item.variant.priceOverride ?? item.product.basePrice),
            total:
              Number(item.variant.priceOverride ?? item.product.basePrice) *
              item.quantity,
          })),
        },
      },
    });

    // ── Initialize Flutterwave payment ────────────────────────────────
    const txRef = `TV-${order.id}-${Date.now()}`;

    const flwPayload = {
      tx_ref: txRef,
      amount: totalInCurrency,
      currency,
      redirect_url: `${APP_URL}/checkout/confirm?provider=flutterwave`,
      customer: {
        email: profile?.email ?? user.email!,
        name: profile?.fullName ?? "Customer",
        phonenumber: profile?.phone ?? address.phone,
      },
      meta: {
        order_id: order.id,
        user_id: user.id,
      },
      customizations: {
        title: "Taylor Vade",
        description: `Order #${order.id.slice(-8).toUpperCase()}`,
        logo: `${APP_URL}/logo.png`,
      },
    };

    const flwRes = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLW_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flwPayload),
    });

    const flwData = await flwRes.json();

    if (flwData.status !== "success") {
      await prisma.order.delete({ where: { id: order.id } });

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: flwData.message ?? "Flutterwave initialization failed",
        },
        { status: 502 }
      );
    }

    // Store tx_ref
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentReference: txRef },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        paymentLink: flwData.data.link,
        txRef,
        orderId: order.id,
        amountCharged: totalInCurrency,
        currency,
      },
    });
  } catch (error) {
    console.error("[POST /api/payments/flutterwave/initialize]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Payment initialization failed" },
      { status: 500 }
    );
  }
}