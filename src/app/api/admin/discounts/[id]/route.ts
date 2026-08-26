// src/app/api/admin/discounts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const body = await req.json();

  const updateData: { isActive?: boolean; value?: number; expiresAt?: Date | null } = {};
  if (body.isActive !== undefined) updateData.isActive = !!body.isActive;
  if (body.value !== undefined) {
    const numValue = Number(body.value);
    if (!Number.isFinite(numValue) || numValue <= 0) {
      return NextResponse.json({ success: false, error: "Value must be a positive number" }, { status: 400 });
    }
    updateData.value = numValue;
  }
  if (body.expiresAt !== undefined) {
    updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  }

  try {
    const discount = await prisma.discount.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, data: discount });
  } catch {
    return NextResponse.json({ success: false, error: "Discount not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  try {
    await prisma.discount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Discount not found" }, { status: 404 });
  }
}
