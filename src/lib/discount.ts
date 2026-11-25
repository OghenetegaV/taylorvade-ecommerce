// src/lib/discount.ts
// Shared server-side discount resolution — used by both the checkout preview
// endpoint and checkout/initialize (which re-validates independently of
// whatever the client claims, the same way shipping rates are re-validated).
//
// Personal codes (subscriber welcome coupons) carry an `email` and `maxUses`:
// they only work for a checkout with that email, and stop working once they
// have been used on `maxUses` successfully paid orders.

import prisma from "@/lib/prisma";

export async function resolveDiscount(code: string, subtotal: number, email?: string | null) {
  const discount = await prisma.discount.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!discount) return { error: "Invalid discount code" as const };
  if (!discount.isActive) return { error: "This code is no longer active" as const };
  if (discount.expiresAt && discount.expiresAt < new Date()) return { error: "This code has expired" as const };

  if (discount.email) {
    // Preview calls may not have an email yet; checkout/initialize always does.
    if (email && email.trim().toLowerCase() !== discount.email) {
      return { error: "This code is linked to a different email address — use the email you signed up with" as const };
    }
  }

  if (discount.maxUses != null) {
    const used = await prisma.order.count({
      where: { discountCode: discount.code, paymentStatus: "SUCCESS" },
    });
    if (used >= discount.maxUses) return { error: "This code has already been used" as const };
  }

  const value = Number(discount.value);
  const amount = discount.type === "PERCENTAGE"
    ? Math.round(subtotal * (value / 100) * 100) / 100
    : Math.min(value, subtotal);

  return { discount, amount };
}
