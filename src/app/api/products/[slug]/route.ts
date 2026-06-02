// src/app/api/products/[slug]/route.ts
// GET /api/products/:slug — fetch single product with all details

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug, isPublished: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { position: "asc" } },
        variants: {
          orderBy: [{ colorLabel: "asc" }, { size: "asc" }],
          include: {
            images: { orderBy: { position: "asc" } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Fetch "Selected for You" — same category, exclude current product
    const selectedForYou = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        isPublished: true,
        id: { not: product.id },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { product, selectedForYou },
    });
  } catch (error) {
    console.error("[GET /api/products/[slug]]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}