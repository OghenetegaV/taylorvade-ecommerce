// src/app/api/admin/analytics/route.ts
// Returns all data needed for dashboard charts and map.
//
// Revenue + top products: only PAID (paymentStatus SUCCESS) orders — real money.
// Location map + status breakdown: ALL orders regardless of payment — so you can
// see where orders are coming from the moment they're placed, even before payment.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function last30Days() {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateKey(d));
  }
  return days;
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // PAID orders (last 30 days) — for revenue + top products.
  const paidOrders = await prisma.order.findMany({
    where: {
      paymentStatus: "SUCCESS",
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
      totalAmount: true,
      status: true,
      items: {
        select: {
          quantity: true,
          total: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
  });

  // ALL orders (last 30 days) — for the location map + orders-by-day count.
  // No payment filter: a new order shows on the map immediately.
  const allRecentOrders = await prisma.order.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: {
      createdAt: true,
      address: { select: { country: true, city: true } },
    },
  });

  // All orders for status breakdown (all time).
  const allOrders = await prisma.order.groupBy({
    by: ["status"],
    _count: { id: true },
    orderBy: { status: "asc" },
  });

  // ── Revenue by day (last 30, PAID only) ───────────────────────
  const revenueMap: Record<string, number> = {};
  paidOrders.forEach(o => {
    const day = dateKey(o.createdAt);
    revenueMap[day] = (revenueMap[day] ?? 0) + Number(o.totalAmount);
  });

  // ── Orders by day (last 30, ALL orders) ───────────────────────
  const ordersMap: Record<string, number> = {};
  allRecentOrders.forEach(o => {
    const day = dateKey(o.createdAt);
    ordersMap[day] = (ordersMap[day] ?? 0) + 1;
  });

  const days = last30Days();
  const revenueByDay = days.map(d => ({ date: d, revenue: Math.round(revenueMap[d] ?? 0) }));
  const ordersByDay  = days.map(d => ({ date: d, orders: ordersMap[d] ?? 0 }));

  // ── Orders by country (ALL orders — shows immediately) ─────────
  const countryMap: Record<string, number> = {};
  allRecentOrders.forEach(o => {
    const c = o.address?.country ?? "Unknown";
    countryMap[c] = (countryMap[c] ?? 0) + 1;
  });
  const byCountry = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // ── Orders by status (all time) ───────────────────────────────
  const byStatus = allOrders.map(g => ({
    status: g.status,
    count: g._count.id,
  }));

  // ── Top products (last 30 days, PAID only) ────────────────────
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  paidOrders.forEach(o => {
    o.items.forEach(item => {
      const id = item.product.id;
      if (!productMap[id]) {
        productMap[id] = { name: item.product.name, qty: 0, revenue: 0 };
      }
      productMap[id].qty     += item.quantity;
      productMap[id].revenue += Number(item.total);
    });
  });
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return NextResponse.json({
    success: true,
    data: { revenueByDay, ordersByDay, byCountry, byStatus, topProducts },
  });
}
