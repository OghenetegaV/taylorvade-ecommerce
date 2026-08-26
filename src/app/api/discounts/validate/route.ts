// src/app/api/discounts/validate/route.ts
// POST { code, subtotal } — preview a discount before checkout. Purely a
// convenience for the checkout UI; checkout/initialize re-validates the code
// itself and never trusts a client-supplied amount.

import { NextRequest, NextResponse } from "next/server";
import { resolveDiscount } from "@/lib/discount";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ success: false, error: "Enter a code" }, { status: 400 });
    }
    const numSubtotal = Number(subtotal);
    if (!Number.isFinite(numSubtotal) || numSubtotal < 0) {
      return NextResponse.json({ success: false, error: "Invalid subtotal" }, { status: 400 });
    }

    const result = await resolveDiscount(code, numSubtotal);
    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { code: result.discount.code, type: result.discount.type, value: Number(result.discount.value), amount: result.amount },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Could not validate code" }, { status: 500 });
  }
}
