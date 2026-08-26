// src/app/api/payments/paystack/webhook/route.ts
// POST /api/payments/paystack/webhook
// Paystack sends signed POST requests here after every payment event

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from "@/lib/email";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

// ── Verify that the request genuinely came from Paystack ──────────────
function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;

  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(rawBody)
    .digest("hex");

  const hashBuf = Buffer.from(hash, "hex");
  const sigBuf = Buffer.from(signatureHeader, "hex");
  if (hashBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, sigBuf);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // ── Security check ────────────────────────────────────────────────
    if (!verifyPaystackSignature(rawBody, signature)) {
      console.warn("[Paystack Webhook] Invalid signature — request rejected");
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log("[Paystack Webhook] Event received:", event.event);

    // ── Handle charge.success ─────────────────────────────────────────
    if (event.event === "charge.success") {
      const { reference, status, amount, customer } = event.data;

      if (status !== "success") {
        return NextResponse.json({ received: true });
      }

      // checkout/initialize uses order.id as the Paystack `reference`, so that's
      // the key to look up by (paymentReference is only set by the old, unused
      // payments/paystack/initialize flow).
      const order = await prisma.order.findUnique({
        where: { id: reference },
        include: {
          items: {
            include: {
              variant: true,
            },
          },
          profile: true,
        },
      });

      if (!order) {
        console.error("[Paystack Webhook] Order not found for reference:", reference);
        return NextResponse.json({ received: true }); // acknowledge to prevent retries
      }

      if (order.paymentStatus === "SUCCESS") {
        // Already processed — idempotent response
        return NextResponse.json({ received: true });
      }

      // Verify amount matches to prevent fraud
      const expectedKobo = Math.round(Number(order.totalAmount) * 100);
      if (amount !== expectedKobo) {
        console.error(
          `[Paystack Webhook] Amount mismatch. Expected ${expectedKobo}, got ${amount}`
        );
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "FAILED", status: "CANCELLED" },
        });
        return NextResponse.json({ received: true });
      }

      // ── Atomic update: mark order paid + decrement stock ─────────────
      await prisma.$transaction(async (tx) => {
        // Re-check inside the transaction — checkout/verify may have already
        // settled this order in a race with this webhook delivery.
        const fresh = await tx.order.findUnique({ where: { id: order.id } });
        if (fresh?.paymentStatus === "SUCCESS") return;

        // Mark order as paid
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "SUCCESS",
            status: "PAID",
          },
        });

        // Decrement stock for each item
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });
        }

        // Clear the user's cart
        await tx.cartItem.deleteMany({
          where: { profileId: order.profileId },
        });
      });

      // Send confirmation + store notification emails (non-blocking)
      sendOrderConfirmationEmail(order.id).catch((e) =>
        console.error("[Email] Failed to send order confirmation:", e)
      );
      sendOrderNotificationEmail(order.id).catch((e) =>
        console.error("[Email] Failed to send order notification:", e)
      );

      console.log("[Paystack Webhook] Order", order.id, "marked as PAID");
    }

    // ── Handle charge.failed ──────────────────────────────────────────
    if (event.event === "charge.failed") {
      const { reference } = event.data;

      await prisma.order.updateMany({
        where: { id: reference, paymentStatus: "PENDING" },
        data: { paymentStatus: "FAILED", status: "CANCELLED" },
      });

      console.log("[Paystack Webhook] Payment failed for reference:", reference);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Paystack Webhook] Unexpected error:", error);
    return NextResponse.json(
      { message: "Webhook processing failed" },
      { status: 500 }
    );
  }
}