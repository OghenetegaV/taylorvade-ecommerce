// src/app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { sizeChart: { select: { id: true } } },
  });
  const data = categories.map(({ sizeChart, ...c }) => ({ ...c, hasChart: !!sizeChart }));
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { name, gender } = await req.json();
  if (!name) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ success: false, error: "Category slug already exists" }, { status: 409 });
  const category = await prisma.category.create({
    data: { name, slug, gender: gender ?? "UNISEX" },
  });
  return NextResponse.json({ success: true, data: category });
}
