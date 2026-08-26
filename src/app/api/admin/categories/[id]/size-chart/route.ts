// src/app/api/admin/categories/[id]/size-chart/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const chart = await prisma.sizeChart.findUnique({ where: { categoryId: id } });
  return NextResponse.json({ success: true, data: chart });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const { sizes } = await req.json();

  if (!Array.isArray(sizes)) {
    return NextResponse.json({ success: false, error: "sizes must be an array of rows" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });

  const chart = await prisma.sizeChart.upsert({
    where: { categoryId: id },
    update: { sizes },
    create: { categoryId: id, sizes },
  });
  return NextResponse.json({ success: true, data: chart });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  await prisma.sizeChart.deleteMany({ where: { categoryId: id } });
  return NextResponse.json({ success: true });
}
