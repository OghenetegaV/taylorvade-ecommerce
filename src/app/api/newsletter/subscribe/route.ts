// src/app/api/newsletter/subscribe/route.ts
// Single entry point for every email signup: footer drawer, checkout opt-in,
// newsletter band and the New Collection launch popup (source "launch-popup").
// Rows live in newsletter_subscribers and are listed at /admin/subscribers.
//
// New subscribers get a personal one-time welcome code, sent by EMAIL ONLY —
// never returned in the response. Guest checkout accepts any email, so showing
// the code on screen would let anyone mint 30% codes with made-up addresses;
// delivering it to the inbox means you have to own the address to use it.

import { NextRequest, NextResponse, after } from "next/server";
import prisma from "@/lib/prisma";
import { issueSubscriberCoupon, SUBSCRIBER_DISCOUNT_PERCENT } from "@/lib/subscriberCoupon";
import { sendSubscriberCouponEmail } from "@/lib/email";

const SOURCES = new Set(["website", "checkout", "launch-popup"]);

export async function POST(req: NextRequest) {
  try {
    const { email, categories, smsOptIn, source } = await req.json();

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please select at least one category." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCats  = categories.filter((c): c is string => typeof c === "string").slice(0, 10);
    const cleanSrc   = SOURCES.has(source) ? source : "website";
    const sms        = smsOptIn === true;
    const early      = cleanSrc === "launch-popup";

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: cleanEmail } });

    if (existing) {
      // Merge rather than overwrite — keep the original source and never
      // un-set an opt-in the person gave earlier.
      await prisma.newsletterSubscriber.update({
        where: { email: cleanEmail },
        data: {
          categories:  Array.from(new Set([...existing.categories, ...cleanCats])),
          smsOptIn:    existing.smsOptIn || sms,
          earlyAccess: existing.earlyAccess || early,
        },
      });
    } else {
      await prisma.newsletterSubscriber.create({
        data: {
          email:       cleanEmail,
          categories:  cleanCats,
          smsOptIn:    sms,
          earlyAccess: early,
          source:      cleanSrc,
        },
      });
    }

    // Mint the welcome code now (so it's in the admin straight away) and
    // email it after the response; failures are logged and the code stays
    // visible at /admin/subscribers so it can be sent by hand.
    const coupon = await issueSubscriberCoupon(cleanEmail).catch((e) => {
      console.error("[Newsletter] coupon issue failed:", e);
      return null;
    });
    if (coupon?.isNew) {
      after(() =>
        sendSubscriberCouponEmail(cleanEmail, coupon.code, SUBSCRIBER_DISCOUNT_PERCENT)
          .catch((e) => console.error("[Newsletter] coupon email failed:", e))
      );
    }

    return NextResponse.json({ success: true, message: "You're on the list." });
  } catch (e) {
    console.error("[Newsletter] subscribe failed:", e);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
