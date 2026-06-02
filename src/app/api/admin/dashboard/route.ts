// src/app/api/admin/dashboard/route.ts
// GET /api/admin/dashboard — aggregate stats for the dashboard

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const now       = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart  = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders,
    ordersToday,
    ordersThisWeek,
    ordersThisMonth,
    pendingOrders,
    processingOrders,
    shippedOrders,
    revenueAll,
    revenueThisMonth,
    revenueToday,
    totalCustomers,
    lowStockVariants,
    outOfStockVariants,
    recentOrders,
  ] = await prisma.$transaction([

    prisma.order.count({ where: { paymentStatus: "SUCCESS" } }),

    prisma.order.count({
      where: { paymentStatus: "SUCCESS", createdAt: { gte: todayStart } },
    }),

    prisma.order.count({
      where: { paymentStatus: "SUCCESS", createdAt: { gte: weekStart } },
    }),

    prisma.order.count({
      where: { paymentStatus: "SUCCESS", createdAt: { gte: monthStart } },
    }),

    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PROCESSING" } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),

    // Total revenue (all time)
    prisma.order.aggregate({
      where: { paymentStatus: "SUCCESS" },
      _sum: { totalAmount: true },
    }),

    // Revenue this month
    prisma.order.aggregate({
      where: { paymentStatus: "SUCCESS", createdAt: { gte: monthStart } },
      _sum: { totalAmount: true },
    }),

    // Revenue today
    prisma.order.aggregate({
      where: { paymentStatus: "SUCCESS", createdAt: { gte: todayStart } },
      _sum: { totalAmount: true },
    }),

    prisma.profile.count({ where: { role: "CUSTOMER" } }),

    // Low stock: 1–5 units remaining
    prisma.productVariant.count({
      where: { stockQuantity: { gt: 0, lte: 5 } },
    }),

    // Out of stock
    prisma.productVariant.count({
      where: { stockQuantity: 0 },
    }),

    // Recent 10 orders
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        profile: { select: { fullName: true, email: true } },
        address: { select: { city: true, country: true } },
        items: { select: { id: true } },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      orders: {
        total: totalOrders,
        today: ordersToday,
        thisWeek: ordersThisWeek,
        thisMonth: ordersThisMonth,
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
      },
      revenue: {
        allTime: Number(revenueAll._sum.totalAmount ?? 0),
        thisMonth: Number(revenueThisMonth._sum.totalAmount ?? 0),
        today: Number(revenueToday._sum.totalAmount ?? 0),
      },
      customers: totalCustomers,
      inventory: {
        lowStock: lowStockVariants,
        outOfStock: outOfStockVariants,
      },
      recentOrders,
    },
  });
}