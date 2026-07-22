// src/app/api/checkout/verify/route.ts
// v2 — Paystack only. GET ?reference=<orderId>
// Verifies the transaction, then idempotently: marks the order PAID, decrements
// variant stock, clears the cart, sends the confirmation email. Safe to call
// repeatedly and safe alongside the Paystack webhook (both check status first).

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const reference = req.nextUrl.searchParams.get("reference");
    if (!reference) {
      return NextResponse.json({ success: false, error: "Missing reference" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: reference, profileId: user.id },
      include: {
        items: { include: { product: { select: { name: true } }, variant: true } },
      },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Already settled (webhook may have won the race) — just report it.
    if (order.paymentStatus === "SUCCESS") {
      return NextResponse.json({ success: true, data: shape(order) });
    }

    // ── Verify with Paystack ─────────────────────────────────────
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await res.json();
    if (!data.status) {
      return NextResponse.json({ success: false, error: "Could not reach Paystack" }, { status: 502 });
    }

    const paid         = data.data.status === "success";
    const amountKobo   = Number(data.data.amount);
    const expectedKobo = Math.round(Number(order.totalAmount) * 100);

    if (!paid || amountKobo < expectedKobo) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED" },
      });
      return NextResponse.json({
        success: false,
        error: paid ? "Payment amount mismatch" : "Payment was not successful",
        data: { status: "FAILED" },
      });
    }

    // ── Settle (idempotent transaction) ──────────────────────────
    await prisma.$transaction(async tx => {
      const fresh = await tx.order.findUnique({ where: { id: order.id } });
      if (fresh?.paymentStatus === "SUCCESS") return; // webhook already settled it

      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "SUCCESS", status: "PAID" },
      });
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }
      await tx.cartItem.deleteMany({ where: { profileId: order.profileId } });
    });

    sendOrderConfirmationEmail(order.id).catch(console.error);

    return NextResponse.json({ success: true, data: shape(order) });
  } catch (e) {
    console.error("checkout/verify:", e);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}

/** Shape consumed by the confirm page (receipt UI + GA4 purchase event). */
function shape(order: {
  id: string; totalAmount: unknown; currency: string;
  items: { quantity: number; unitPrice: unknown; product: { name: string } }[];
}) {
  return {
    status: "PAID",
    orderId: order.id,
    total: Number(order.totalAmount),
    currency: order.currency,
    items: order.items.map(i => ({
      name: i.product.name,
      quantity: i.quantity,
      price: Number(i.unitPrice),
    })),
  };
}
