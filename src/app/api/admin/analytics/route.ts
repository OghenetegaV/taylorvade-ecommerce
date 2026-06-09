// src/app/api/admin/analytics/route.ts
// Returns all data needed for dashboard charts and map

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

  // Fetch paid orders in last 30 days with address and items
  const recentOrders = await prisma.order.findMany({
    where: {
      paymentStatus: "SUCCESS",
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
      totalAmount: true,
      status: true,
      address: { select: { country: true, city: true } },
      items: {
        select: {
          quantity: true,
          total: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
  });

  // All orders for status breakdown (not just 30 days)
  const allOrders = await prisma.order.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  // ── Revenue by day (last 30) ──────────────────────────────────
  const revenueMap: Record<string, number> = {};
  const ordersMap: Record<string, number> = {};
  recentOrders.forEach(o => {
    const day = dateKey(o.createdAt);
    revenueMap[day] = (revenueMap[day] ?? 0) + Number(o.totalAmount);
    ordersMap[day]  = (ordersMap[day] ?? 0) + 1;
  });

  const days = last30Days();
  const revenueByDay  = days.map(d => ({ date: d, revenue: Math.round(revenueMap[d] ?? 0) }));
  const ordersByDay   = days.map(d => ({ date: d, orders: ordersMap[d] ?? 0 }));

  // ── Orders by country ─────────────────────────────────────────
  const countryMap: Record<string, number> = {};
  recentOrders.forEach(o => {
    const c = o.address?.country ?? "Unknown";
    countryMap[c] = (countryMap[c] ?? 0) + 1;
  });
  const byCountry = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // ── Orders by status ─────────────────────────────────────────
  const byStatus = allOrders.map(g => ({
    status: g.status,
    count: g._count.id,
  }));

  // ── Top products (last 30 days) ───────────────────────────────
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  recentOrders.forEach(o => {
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
