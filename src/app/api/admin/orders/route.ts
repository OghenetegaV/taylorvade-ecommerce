// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("q");
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const skip   = (page - 1) * limit;

  const where: any = {
    ...(status ? { status } : {}),
    ...(search ? { OR: [
      { id: { contains: search, mode: "insensitive" } },
      { profile: { email:    { contains: search, mode: "insensitive" } } },
      { profile: { fullName: { contains: search, mode: "insensitive" } } },
    ]} : {}),
  };

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where, skip, take: limit, orderBy: { createdAt: "desc" },
      include: {
        profile: { select: { id: true, fullName: true, email: true, phone: true } },
        address: { select: { fullName: true, phone: true, addressLine1: true, city: true, state: true, country: true } },
        items: {
          include: {
            product: { select: { name: true, slug: true } },
            variant: { select: { colorLabel: true, size: true, sku: true } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
}
