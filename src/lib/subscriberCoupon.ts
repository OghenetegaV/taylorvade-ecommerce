// src/lib/subscriberCoupon.ts
// Every new email subscriber gets a personal, one-time welcome code
// (e.g. VADE30-K7M2QX): SUBSCRIBER_DISCOUNT_PERCENT off, valid immediately,
// usable once, and only at checkout with the email it was issued to.

import { randomInt } from "crypto";
import prisma from "@/lib/prisma";
import { SUBSCRIBER_DISCOUNT_PERCENT } from "@/lib/subscriberOffer";

export { SUBSCRIBER_DISCOUNT_PERCENT };
const PREFIX = `VADE${SUBSCRIBER_DISCOUNT_PERCENT}-`;
// No 0/O/1/I/L — codes get typed from emails and screenshots.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return PREFIX + s;
}

/**
 * Returns the subscriber's welcome code, creating it on first call.
 * `isNew` is true only when a code was minted by this call.
 */
export async function issueSubscriberCoupon(email: string): Promise<{ code: string; isNew: boolean }> {
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email },
    select: { couponCode: true },
  });
  if (!subscriber) throw new Error(`Subscriber ${email} not found`);
  if (subscriber.couponCode) return { code: subscriber.couponCode, isNew: false };

  // Retry on the (very unlikely) code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      await prisma.$transaction([
        prisma.discount.create({
          data: {
            code,
            type: "PERCENTAGE",
            value: SUBSCRIBER_DISCOUNT_PERCENT,
            maxUses: 1,
            email,
          },
        }),
        // Only claim the slot if no concurrent request beat us to it.
        prisma.newsletterSubscriber.updateMany({
          where: { email, couponCode: null },
          data: { couponCode: code },
        }),
      ]);
      const after = await prisma.newsletterSubscriber.findUnique({
        where: { email },
        select: { couponCode: true },
      });
      if (after?.couponCode && after.couponCode !== code) {
        // A parallel signup won — drop our orphan code and use theirs.
        await prisma.discount.delete({ where: { code } }).catch(() => {});
        return { code: after.couponCode, isNew: false };
      }
      return { code, isNew: true };
    } catch (e) {
      const isUniqueClash = typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002";
      if (!isUniqueClash) throw e;
    }
  }
  throw new Error("Could not generate a unique coupon code");
}
