// src/app/api/products/route.ts
// GET /api/products — fetch products with full filtering, sorting, pagination

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse } from "@/types";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // ── Query params ──────────────────────────────────────────────
    const gender    = searchParams.get("gender")?.toUpperCase();     // MEN | WOMEN | UNISEX
    const category  = searchParams.get("category");                   // category slug
    const isNew     = searchParams.get("new") === "true";
    const featured  = searchParams.get("featured") === "true";
    const search    = searchParams.get("q");                         // name search
    const sortBy    = searchParams.get("sort") ?? "createdAt";       // createdAt | basePrice
    const order     = searchParams.get("order") ?? "desc";           // asc | desc
    const page      = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit     = Math.min(48, parseInt(searchParams.get("limit") ?? "24"));
    const skip      = (page - 1) * limit;
    // ──────────────────────────────────────────────────────────────

const where: Prisma.ProductWhereInput = {      isPublished: true,
      ...(gender && ["MEN", "WOMEN", "UNISEX"].includes(gender)
        ? { genders: { has: gender as "MEN" | "WOMEN" | "UNISEX" } }
        : {}),
      ...(isNew ? { isNew: true } : {}),
      ...(featured ? { isFeatured: true } : {}),
      ...(category ? { categories: { some: { slug: category } } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { type: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order as "asc" | "desc" },
        include: {
          categories: { select: { id: true, name: true, slug: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
            orderBy: { position: "asc" },
          },
          variants: {
            select: {
              id: true,
              colorLabel: true,
              colorHex: true,
              size: true,
              stockQuantity: true,
              sku: true,
              priceOverride: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json<ApiResponse<{
      products: typeof products;
      pagination: { page: number; limit: number; total: number; pages: number };
    }>>({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}