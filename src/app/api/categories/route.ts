// src/app/api/categories/route.ts
// GET /api/categories?gender=MEN|WOMEN|UNISEX — public storefront taxonomy
// (nav dropdown, category filters). No auth: this is just product taxonomy.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gender = searchParams.get("gender")?.toUpperCase();

  const categories = await prisma.category.findMany({
    where: gender && ["MEN", "WOMEN", "UNISEX"].includes(gender)
      ? { gender: gender as "MEN" | "WOMEN" | "UNISEX" }
      : {},
    select: { id: true, name: true, slug: true, gender: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ success: true, data: categories });
}
