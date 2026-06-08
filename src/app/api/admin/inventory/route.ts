// src/app/api/admin/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q");
  const filter = searchParams.get("filter");
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const skip   = (page - 1) * limit;

  const variantFilter: any =
    filter === "low" ? { stockQuantity: { gt: 0, lte: 5 } } :
    filter === "out" ? { stockQuantity: 0 } : {};

  const where: any = {
    ...(search ? { OR: [
      { name: { contains: search, mode: "insensitive" } },
      { type: { contains: search, mode: "insensitive" } },
      { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
    ]} : {}),
    ...(filter && filter !== "all" ? { variants: { some: variantFilter } } : {}),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where, skip, take: limit, orderBy: { name: "asc" },
      select: {
        id: true, name: true, slug: true, type: true, gender: true, isPublished: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        variants: {
          where: variantFilter,
          orderBy: [{ colorLabel: "asc" }, { size: "asc" }],
          select: { id: true, colorLabel: true, size: true, sku: true, stockQuantity: true, priceOverride: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const data = products.map(p => ({
    ...p,
    stockSummary: {
      total:      p.variants.reduce((s, v) => s + v.stockQuantity, 0),
      outOfStock: p.variants.filter(v => v.stockQuantity === 0).length,
      lowStock:   p.variants.filter(v => v.stockQuantity > 0 && v.stockQuantity <= 5).length,
    },
  }));

  return NextResponse.json({
    success: true,
    data: { products: data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
}
