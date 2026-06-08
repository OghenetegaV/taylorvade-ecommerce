// src/app/api/admin/inventory/[variantId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ variantId: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  try {
    const { variantId } = await params;
    const { stockQuantity, operation = "set" } = await req.json();

    if (typeof stockQuantity !== "number" || stockQuantity < 0) {
      return NextResponse.json(
        { success: false, error: "stockQuantity must be a non-negative number" },
        { status: 400 }
      );
    }

    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) return NextResponse.json({ success: false, error: "Variant not found" }, { status: 404 });

    const updateData =
      operation === "increment" ? { stockQuantity: { increment: stockQuantity } } :
      operation === "decrement" ? { stockQuantity: Math.max(0, variant.stockQuantity - stockQuantity) } :
      { stockQuantity };

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
      select: { id: true, sku: true, colorLabel: true, size: true, stockQuantity: true, product: { select: { name: true } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update stock" }, { status: 500 });
  }
}
