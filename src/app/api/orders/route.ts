// src/app/api/orders/route.ts
// GET /api/orders — fetch current user's orders

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));
    const skip  = (page - 1) * limit;

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where: { profileId: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          address: {
            select: {
              fullName: true,
              addressLine1: true,
              city: true,
              state: true,
              country: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  slug: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                    select: { url: true },
                  },
                },
              },
              variant: {
                select: { colorLabel: true, size: true },
              },
            },
          },
        },
      }),
      prisma.order.count({ where: { profileId: user.id } }),
    ]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/orders]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}