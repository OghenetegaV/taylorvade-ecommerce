// src/app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(req.url);
  const search  = searchParams.get("q");
  const gender  = searchParams.get("gender");
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit   = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const skip    = (page - 1) * limit;

  const where: any = {
    ...(gender ? { gender } : {}),
    ...(search ? { OR: [
      { name: { contains: search, mode: "insensitive" } },
      { type: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ]} : {}),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        images:   { where: { isPrimary: true }, take: 1, select: { url: true } },
        variants: { select: { id: true, stockQuantity: true, size: true, colorLabel: true } },
        _count:   { select: { variants: true, orderItems: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: { products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await req.json();
    const {
      name, slug, type, description, editorNotes, sizeFit, deliveryReturns,
      basePrice, gender, categoryId, isNew, isFeatured, isPublished,
      variants, images,
    } = body;

    // Validate required fields
    if (!name || !slug || !type || !basePrice || !categoryId) {
      return NextResponse.json(
        { success: false, error: "name, slug, type, basePrice, categoryId are required" },
        { status: 400 }
      );
    }

    // Check slug unique
    const exists = await prisma.product.findUnique({ where: { slug } });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name, slug, type,
        description:    description    || null,
        editorNotes:    editorNotes    || null,
        sizeFit:        sizeFit        || null,
        deliveryReturns: deliveryReturns || null,
        basePrice:      parseFloat(basePrice),
        gender:         gender         || "UNISEX",
        categoryId,
        isNew:          isNew          ?? false,
        isFeatured:     isFeatured     ?? false,
        isPublished:    isPublished    ?? false,

        // Create variants
        variants: variants?.length ? {
          create: variants.map((v: any) => ({
            colorLabel:    v.colorLabel,
            colorHex:      v.colorHex     || null,
            size:          v.size,
            sku:           v.sku,
            stockQuantity: parseInt(v.stockQuantity) || 0,
            priceOverride: v.priceOverride ? parseFloat(v.priceOverride) : null,
          })),
        } : undefined,

        // Create images
        images: images?.length ? {
          create: images.map((img: any, i: number) => ({
            url:       img.url,
            altText:   img.altText   || name,
            position:  img.position  ?? i,
            isPrimary: img.isPrimary ?? i === 0,
            variantId: img.variantId || null,
          })),
        } : undefined,
      },
      include: {
        variants: true,
        images:   true,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (e: any) {
    console.error("[POST /api/admin/products]", e);
    return NextResponse.json(
      { success: false, error: e.message ?? "Failed to create product" },
      { status: 500 }
    );
  }
}
