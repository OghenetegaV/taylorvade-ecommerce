// src/app/api/wishlist/route.ts
// GET    /api/wishlist              — list the signed-in user's wishlist
// GET    /api/wishlist?productId=x  — { inWishlist: boolean } for one product
// POST   /api/wishlist  { productId } — add
// DELETE /api/wishlist?productId=x  — remove

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Please sign in to view your wishlist" }, { status: 401 });
  }

  const productId = req.nextUrl.searchParams.get("productId");
  if (productId) {
    const existing = await prisma.wishlist.findUnique({
      where: { profileId_productId: { profileId: user.id, productId } },
    });
    return NextResponse.json({ success: true, data: { inWishlist: !!existing } });
  }

  const items = await prisma.wishlist.findMany({
    where: { profileId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true, name: true, slug: true, basePrice: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
    },
  });
  return NextResponse.json({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Please sign in to save items to your wishlist" }, { status: 401 });
  }

  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json({ success: false, error: "productId is required" }, { status: 400 });
  }

  const item = await prisma.wishlist.upsert({
    where: { profileId_productId: { profileId: user.id, productId } },
    update: {},
    create: { profileId: user.id, productId },
  });
  return NextResponse.json({ success: true, data: item });
}

export async function DELETE(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Please sign in to manage your wishlist" }, { status: 401 });
  }

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ success: false, error: "productId is required" }, { status: 400 });
  }

  await prisma.wishlist.deleteMany({ where: { profileId: user.id, productId } });
  return NextResponse.json({ success: true });
}
