// src/app/api/payments/paystack/initialize/route.ts
// POST /api/payments/paystack/initialize
// Creates a Paystack payment session and returns the authorization URL

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

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
    const { addressId, notes } = body;

    if (!addressId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Delivery address is required" },
        { status: 400 }
      );
    }

    // ── Validate address belongs to user ─────────────────────────────
    const address = await prisma.address.findFirst({
      where: { id: addressId, profileId: user.id },
    });

    if (!address) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    // ── Fetch cart items ──────────────────────────────────────────────
    const cartItems = await prisma.cartItem.findMany({
      where: { profileId: user.id },
      include: {
        product: { select: { id: true, name: true, basePrice: true } },
        variant: { select: { id: true, priceOverride: true, stockQuantity: true, sku: true } },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Your cart is empty" },
        { status: 400 }
      );
    }

    // ── Validate stock and compute total ─────────────────────────────
    let totalNGN = 0;

    for (const item of cartItems) {
      if (item.variant.stockQuantity < item.quantity) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Insufficient stock for ${item.product.name} (${item.variant.sku})`,
          },
          { status: 409 }
        );
      }
      const price = Number(item.variant.priceOverride ?? item.product.basePrice);
      totalNGN += price * item.quantity;
    }

    // ── Create pending Order ──────────────────────────────────────────
    const profile = await prisma.profile.findUnique({ where: { id: user.id } });

    const order = await prisma.order.create({
      data: {
        profileId: user.id,
        addressId,
        totalAmount: totalNGN,
        currency: "NGN",
        paymentProvider: "PAYSTACK",
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

    // ── Initialize Paystack transaction ───────────────────────────────
    // Paystack requires amount in KOBO (1 NGN = 100 kobo)
    const amountInKobo = Math.round(totalNGN * 100);

    const paystackPayload = {
      email: profile?.email ?? user.email!,
      amount: amountInKobo,
      reference: order.id,                          // use order ID as reference
      callback_url: `${APP_URL}/checkout/confirm?provider=paystack`,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        cart_size: cartItems.length,
      },
      channels: ["card", "bank", "ussd", "bank_transfer"], // support all NGN channels
    };

    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackPayload),
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      // Roll back order on Paystack failure
      await prisma.order.delete({ where: { id: order.id } });

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: paystackData.message ?? "Paystack initialization failed",
        },
        { status: 502 }
      );
    }

    // Store the Paystack reference on the order
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentReference: paystackData.data.reference },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        authorizationUrl: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        orderId: order.id,
      },
    });
  } catch (error) {
    console.error("[POST /api/payments/paystack/initialize]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Payment initialization failed" },
      { status: 500 }
    );
  }
}