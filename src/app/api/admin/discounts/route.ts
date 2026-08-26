// src/app/api/admin/discounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const discounts = await prisma.discount.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ success: true, data: discounts });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { code, type, value, expiresAt } = await req.json();

  if (!code || !String(code).trim()) {
    return NextResponse.json({ success: false, error: "Code is required" }, { status: 400 });
  }
  if (type !== "PERCENTAGE" && type !== "FIXED") {
    return NextResponse.json({ success: false, error: "Type must be PERCENTAGE or FIXED" }, { status: 400 });
  }
  const numValue = Number(value);
  if (!Number.isFinite(numValue) || numValue <= 0) {
    return NextResponse.json({ success: false, error: "Value must be a positive number" }, { status: 400 });
  }
  if (type === "PERCENTAGE" && numValue > 100) {
    return NextResponse.json({ success: false, error: "Percentage can't exceed 100" }, { status: 400 });
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const existing = await prisma.discount.findUnique({ where: { code: normalizedCode } });
  if (existing) {
    return NextResponse.json({ success: false, error: "That code already exists" }, { status: 409 });
  }

  const discount = await prisma.discount.create({
    data: {
      code: normalizedCode,
      type,
      value: numValue,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
  return NextResponse.json({ success: true, data: discount });
}
