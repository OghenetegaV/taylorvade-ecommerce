// src/app/api/reviews/route.ts
// GET  /api/reviews?productId=x&sort=recent|highest|lowest&query=text — list + aggregate
// POST /api/reviews { productId, rating, title, body, authorName, authorLocation } — submit a review

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ success: false, error: "productId is required" }, { status: 400 });
  }
  const sort = req.nextUrl.searchParams.get("sort") ?? "recent";
  const query = req.nextUrl.searchParams.get("query")?.trim();

  const orderBy =
    sort === "highest" ? { rating: "desc" as const }
    : sort === "lowest" ? { rating: "asc" as const }
    : { createdAt: "desc" as const };

  const [reviews, allForProduct] = await Promise.all([
    prisma.review.findMany({
      where: {
        productId,
        ...(query
          ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { body: { contains: query, mode: "insensitive" } }] }
          : {}),
      },
      orderBy,
    }),
    prisma.review.findMany({ where: { productId }, select: { rating: true } }),
  ]);

  const count = allForProduct.length;
  const average = count > 0 ? allForProduct.reduce((s, r) => s + r.rating, 0) / count : 0;
  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of allForProduct) ratingCounts[r.rating] = (ratingCounts[r.rating] ?? 0) + 1;

  return NextResponse.json({
    success: true,
    data: { reviews, average, count, ratingCounts },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, rating, title, body: reviewBody, authorName, authorLocation } = body;

  if (!productId || !authorName?.trim() || !reviewBody?.trim()) {
    return NextResponse.json({ success: false, error: "Name and review are required" }, { status: 400 });
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ success: false, error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  const user = await getServerUser();
  let verifiedBuyer = false;
  if (user) {
    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { profileId: user.id, status: { in: ["DELIVERED", "SHIPPED", "PROCESSING", "PAID"] } },
      },
    });
    verifiedBuyer = !!purchase;
  }

  const review = await prisma.review.create({
    data: {
      productId,
      profileId: user?.id ?? null,
      authorName: authorName.trim(),
      authorLocation: authorLocation?.trim() || null,
      rating: ratingNum,
      title: title?.trim() || null,
      body: reviewBody.trim(),
      verifiedBuyer,
    },
  });

  return NextResponse.json({ success: true, data: review });
}
