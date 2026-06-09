// src/app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: { orderBy: [{ colorLabel: "asc" }, { size: "asc" }] },
      images:   { orderBy: { position: "asc" } },
    },
  });
  if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: product });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Check if product has paid orders
  const orderedCount = await prisma.orderItem.count({
    where: {
      productId: id,
      order: { paymentStatus: "SUCCESS" },
    },
  });

  if (orderedCount > 0) {
    // Don't delete — just unpublish
    await prisma.product.update({ where: { id }, data: { isPublished: false } });
    return NextResponse.json({
      success: true,
      message: "Product has existing orders — it has been unpublished instead of deleted.",
      action: "unpublished",
    });
  }

  // Safe to delete (cascades to variants, images)
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true, message: "Product deleted.", action: "deleted" });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const body   = await req.json();

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(body.name          !== undefined ? { name: body.name }                 : {}),
      ...(body.type          !== undefined ? { type: body.type }                 : {}),
      ...(body.description   !== undefined ? { description: body.description }   : {}),
      ...(body.editorNotes   !== undefined ? { editorNotes: body.editorNotes }   : {}),
      ...(body.sizeFit       !== undefined ? { sizeFit: body.sizeFit }           : {}),
      ...(body.deliveryReturns !== undefined ? { deliveryReturns: body.deliveryReturns } : {}),
      ...(body.basePrice     !== undefined ? { basePrice: parseFloat(body.basePrice) } : {}),
      ...(body.isNew         !== undefined ? { isNew: body.isNew }               : {}),
      ...(body.isFeatured    !== undefined ? { isFeatured: body.isFeatured }     : {}),
      ...(body.isPublished   !== undefined ? { isPublished: body.isPublished }   : {}),
    },
  });
  return NextResponse.json({ success: true, data: updated });
}
