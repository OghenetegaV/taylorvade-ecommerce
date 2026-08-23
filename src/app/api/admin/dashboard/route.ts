// src/app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart  = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders, ordersToday, ordersWeek, ordersMonth,
    pending, processing, shipped,
    revAll, revMonth, revToday,
    customerGroups, lowStock, outOfStock, recentOrders,
  ] = await prisma.$transaction([
    prisma.order.count({ where: { paymentStatus: "SUCCESS" } }),
    prisma.order.count({ where: { paymentStatus: "SUCCESS", createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { paymentStatus: "SUCCESS", createdAt: { gte: weekStart } } }),
    prisma.order.count({ where: { paymentStatus: "SUCCESS", createdAt: { gte: monthStart } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PROCESSING" } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.order.aggregate({ where: { paymentStatus: "SUCCESS" }, _sum: { totalAmount: true } }),
    prisma.order.aggregate({ where: { paymentStatus: "SUCCESS", createdAt: { gte: monthStart } }, _sum: { totalAmount: true } }),
    prisma.order.aggregate({ where: { paymentStatus: "SUCCESS", createdAt: { gte: todayStart } }, _sum: { totalAmount: true } }),
    // Customers = DISTINCT people who have placed an order (any status),
    // not just anyone who registered. groupBy profileId → number of groups.
    prisma.order.groupBy({ by: ["profileId"], _count: { id: true }, orderBy: { profileId: "asc" } }),
    prisma.productVariant.count({ where: { stockQuantity: { gt: 0, lte: 5 } } }),
    prisma.productVariant.count({ where: { stockQuantity: 0 } }),
    prisma.order.findMany({
      take: 10, orderBy: { createdAt: "desc" },
      include: {
        profile: { select: { fullName: true, email: true } },
        address: { select: { city: true, country: true } },
        items:   { select: { id: true } },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      orders: { total: totalOrders, today: ordersToday, thisWeek: ordersWeek, thisMonth: ordersMonth, pending, processing, shipped },
      revenue: {
        allTime:   Number(revAll._sum.totalAmount ?? 0),
        thisMonth: Number(revMonth._sum.totalAmount ?? 0),
        today:     Number(revToday._sum.totalAmount ?? 0),
      },
      // Distinct customers who have ordered.
      customers: customerGroups.length,
      inventory: { lowStock, outOfStock },
      recentOrders,
    },
  });
}
