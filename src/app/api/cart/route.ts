// src/app/api/cart/route.ts
// GET  /api/cart        — fetch cart items
// POST /api/cart        — add item to cart
// PUT  /api/cart        — update item quantity
// DELETE /api/cart      — remove item from cart

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

// ── Helpers ────────────────────────────────────────────────────────────

function getSessionId(request: NextRequest): string {
  // Guest cart identifier stored in cookie
  return request.cookies.get("tv_session")?.value ?? crypto.randomUUID();
}

async function getCartWhere(request: NextRequest) {
  const user = await getServerUser();
  if (user) return { profileId: user.id };
  return { sessionId: getSessionId(request) };
}

// ── GET — fetch cart ───────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const where = await getCartWhere(request);

    const cartItems = await prisma.cartItem.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
        variant: {
          select: {
            id: true,
            colorLabel: true,
            size: true,
            sku: true,
            stockQuantity: true,
            priceOverride: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Compute subtotal
    const subtotal = cartItems.reduce((sum, item) => {
      const price = Number(item.variant.priceOverride ?? item.product.basePrice);
      return sum + price * item.quantity;
    }, 0);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { items: cartItems, subtotal, itemCount: cartItems.length },
    });
  } catch (error) {
    console.error("[GET /api/cart]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// ── POST — add item ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, quantity = 1 } = body;

    if (!productId || !variantId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "productId and variantId are required" },
        { status: 400 }
      );
    }

    // Check stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Variant not found" },
        { status: 404 }
      );
    }

    if (variant.stockQuantity < quantity) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Insufficient stock" },
        { status: 409 }
      );
    }

    const user = await getServerUser();
    const sessionId = getSessionId(request);

    // If item already in cart, increment quantity
    const existing = await prisma.cartItem.findFirst({
      where: {
        productId,
        variantId,
        ...(user ? { profileId: user.id } : { sessionId }),
      },
    });

    let cartItem;

    if (existing) {
      const newQty = existing.quantity + quantity;

      if (variant.stockQuantity < newQty) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Not enough stock available" },
          { status: 409 }
        );
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          productId,
          variantId,
          quantity,
          ...(user ? { profileId: user.id } : { sessionId }),
        },
      });
    }

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: cartItem,
      message: "Item added to cart",
    });

    // Set session cookie for guests
    if (!user) {
      response.cookies.set("tv_session", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("[POST /api/cart]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to add item" },
      { status: 500 }
    );
  }
}

// ── PUT — update quantity ──────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartItemId, quantity } = body;

    if (!cartItemId || quantity == null) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "cartItemId and quantity are required" },
        { status: 400 }
      );
    }

    const where = await getCartWhere(request);

    if (quantity <= 0) {
      // Treat as remove
      const { count } = await prisma.cartItem.deleteMany({ where: { id: cartItemId, ...where } });
      if (count === 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Cart item not found" },
          { status: 404 }
        );
      }
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Item removed",
      });
    }

    const { count } = await prisma.cartItem.updateMany({
      where: { id: cartItemId, ...where },
      data: { quantity },
    });
    if (count === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cart item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
    });
  } catch (error) {
    console.error("[PUT /api/cart]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

// ── DELETE — remove item ───────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get("id");

    if (!cartItemId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cart item ID is required" },
        { status: 400 }
      );
    }

    const where = await getCartWhere(request);
    const { count } = await prisma.cartItem.deleteMany({ where: { id: cartItemId, ...where } });
    if (count === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cart item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("[DELETE /api/cart]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to remove item" },
      { status: 500 }
    );
  }
}