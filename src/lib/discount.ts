// src/lib/discount.ts
// Shared server-side discount resolution — used by both the checkout preview
// endpoint and checkout/initialize (which re-validates independently of
// whatever the client claims, the same way shipping rates are re-validated).

import prisma from "@/lib/prisma";

export async function resolveDiscount(code: string, subtotal: number) {
  const discount = await prisma.discount.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!discount) return { error: "Invalid discount code" as const };
  if (!discount.isActive) return { error: "This code is no longer active" as const };
  if (discount.expiresAt && discount.expiresAt < new Date()) return { error: "This code has expired" as const };

  const value = Number(discount.value);
  const amount = discount.type === "PERCENTAGE"
    ? Math.round(subtotal * (value / 100) * 100) / 100
    : Math.min(value, subtotal);

  return { discount, amount };
}
