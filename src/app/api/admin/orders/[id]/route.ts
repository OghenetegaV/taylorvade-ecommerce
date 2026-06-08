// src/app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const TRANSITIONS: Record<string, string[]> = {
  PENDING:    ["PAID","CANCELLED"],
  PAID:       ["PROCESSING","CANCELLED"],
  PROCESSING: ["SHIPPED","CANCELLED"],
  SHIPPED:    ["DELIVERED"],
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      profile: { select: { id: true, fullName: true, email: true, phone: true } },
      address: true,
      items: {
        include: {
          product: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } },
          variant: { select: { colorLabel: true, colorHex: true, size: true, sku: true } },
        },
      },
    },
  });
  if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  try {
    const { id } = await params;
    const { status } = await req.json();
    if (!status) return NextResponse.json({ success: false, error: "status required" }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });

    const allowed = TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Cannot move from ${order.status} to ${status}` },
        { status: 422 }
      );
    }

    const updated = await prisma.order.update({ where: { id }, data: { status } });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
