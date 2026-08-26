// src/app/api/payments/flutterwave/webhook/route.ts
// POST /api/payments/flutterwave/webhook

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from "@/lib/email";

const FLW_WEBHOOK_HASH = process.env.FLUTTERWAVE_WEBHOOK_HASH!;
const FLW_SECRET       = process.env.FLUTTERWAVE_SECRET_KEY!;

function verifyFlutterwaveHash(verifHash: string | null): boolean {
  if (!verifHash) return false;
  const a = Buffer.from(verifHash);
  const b = Buffer.from(FLW_WEBHOOK_HASH);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  try {
    // ── Verify signature ─────────────────────────────────────────────
    const verifHash = request.headers.get("verif-hash");

    if (!verifyFlutterwaveHash(verifHash)) {
      console.warn("[Flutterwave Webhook] Invalid hash — request rejected");
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    const event = await request.json();
    console.log("[Flutterwave Webhook] Event received:", event.event);

    if (event.event === "charge.completed") {
      const { tx_ref, status, amount, currency, id: flwTransactionId } = event.data;

      if (status !== "successful") {
        // Handle failed payments
        await prisma.order.updateMany({
          where: { paymentReference: tx_ref, paymentStatus: "PENDING" },
          data: { paymentStatus: "FAILED", status: "CANCELLED" },
        });
        return NextResponse.json({ received: true });
      }

      // ── Verify transaction with Flutterwave API (never trust webhooks alone) ──
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${flwTransactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${FLW_SECRET}`,
          },
        }
      );

      const verifyData = await verifyRes.json();

      if (
        verifyData.status !== "success" ||
        verifyData.data.status !== "successful"
      ) {
        console.error("[Flutterwave Webhook] Transaction verification failed");
        return NextResponse.json({ received: true });
      }

      const order = await prisma.order.findUnique({
        where: { paymentReference: tx_ref },
        include: {
          items: { include: { variant: true } },
        },
      });

      if (!order) {
        console.error("[Flutterwave Webhook] Order not found for tx_ref:", tx_ref);
        return NextResponse.json({ received: true });
      }

      if (order.paymentStatus === "SUCCESS") {
        return NextResponse.json({ received: true }); // Already processed
      }

      // ── Atomic update ─────────────────────────────────────────────
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "SUCCESS",
            status: "PAID",
          },
        });

        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }

        await tx.cartItem.deleteMany({
          where: { profileId: order.profileId },
        });
      });

      sendOrderConfirmationEmail(order.id).catch((e) =>
        console.error("[Email] Order confirmation failed:", e)
      );
      sendOrderNotificationEmail(order.id).catch((e) =>
        console.error("[Email] Order notification failed:", e)
      );

      console.log("[Flutterwave Webhook] Order", order.id, "marked as PAID");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Flutterwave Webhook] Unexpected error:", error);
    return NextResponse.json(
      { message: "Webhook processing failed" },
      { status: 500 }
    );
  }
}