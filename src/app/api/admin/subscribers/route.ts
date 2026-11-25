// src/app/api/admin/subscribers/route.ts
// Email list for the admin: newsletter + New Collection early-access signups,
// each with their personal welcome code and whether it has been redeemed.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, email: true, categories: true, smsOptIn: true,
      earlyAccess: true, source: true, couponCode: true, createdAt: true,
    },
  });

  const codes = subscribers.map(s => s.couponCode).filter((c): c is string => !!c);
  const redeemed = codes.length
    ? await prisma.order.groupBy({
        by: ["discountCode"],
        where: { discountCode: { in: codes }, paymentStatus: "SUCCESS" },
        orderBy: { discountCode: "asc" },
        _count: { id: true },
      })
    : [];
  const used = new Set(redeemed.map(r => r.discountCode));

  return NextResponse.json({
    success: true,
    data: subscribers.map(s => ({ ...s, couponUsed: !!s.couponCode && used.has(s.couponCode) })),
  });
}
