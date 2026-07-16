// src/app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const TRANSITIONS: Record<string, string[]> = {
  PENDING:    ["PAID","CANCELLED"], PAID: ["PROCESSING","CANCELLED"],
  PROCESSING: ["SHIPPED","CANCELLED"], SHIPPED: ["DELIVERED"],
};

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  try {
    const { id } = await params;
    const body   = await req.json();

    const updateData: any = {};
    if (body.name            !== undefined) updateData.name            = body.name;
    if (body.type            !== undefined) updateData.type            = body.type;
    if (body.description     !== undefined) updateData.description     = body.description     || null;
    if (body.editorNotes     !== undefined) updateData.editorNotes     = body.editorNotes     || null;
    if (body.sizeFit         !== undefined) updateData.sizeFit         = body.sizeFit         || null;
    if (body.deliveryReturns !== undefined) updateData.deliveryReturns = body.deliveryReturns || null;
    if (body.basePrice       !== undefined) updateData.basePrice       = parseFloat(body.basePrice);
    if (body.gender          !== undefined) updateData.gender          = body.gender;
    if (body.categoryId      !== undefined) updateData.categoryId      = body.categoryId;
    if (body.isNew           !== undefined) updateData.isNew           = body.isNew;
    if (body.isFeatured      !== undefined) updateData.isFeatured      = body.isFeatured;
    if (body.isPublished     !== undefined) updateData.isPublished     = body.isPublished;

    const updated = await prisma.product.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message ?? "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const orderedCount = await prisma.orderItem.count({
    where: { productId: id, order: { paymentStatus: "SUCCESS" } },
  });

  if (orderedCount > 0) {
    await prisma.product.update({ where: { id }, data: { isPublished: false } });
    return NextResponse.json({ success: true, message: "Unpublished (has orders)", action: "unpublished" });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true, message: "Deleted", action: "deleted" });
}
