// src/app/api/currency/rates/route.ts
// GET — exchange rates with NGN as the base (1 NGN = rates[code] units of code).
// Used for DISPLAY conversion only — every actual charge still runs through
// Paystack in NGN, this never changes what a customer is billed.

import { NextResponse } from "next/server";

// Approximate fallback used only if the live rate fetch fails.
const FALLBACK_RATES: Record<string, number> = {
  NGN: 1,
  USD: 0.00062,
  GBP: 0.00049,
  EUR: 0.00057,
  CAD: 0.00086,
};

let cache: { rates: Record<string, number>; source: string; expires: number } | null = null;
const CACHE_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  if (cache && cache.expires > Date.now()) {
    return NextResponse.json({ success: true, data: { rates: cache.rates, source: cache.source } });
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/NGN", { next: { revalidate: 3600 } });
    const data = await res.json();
    if (data?.result === "success" && data?.rates) {
      cache = { rates: data.rates, source: "live", expires: Date.now() + CACHE_MS };
      return NextResponse.json({ success: true, data: { rates: data.rates, source: "live" } });
    }
  } catch {
    // fall through to the static table below
  }

  cache = { rates: FALLBACK_RATES, source: "fallback", expires: Date.now() + CACHE_MS };
  return NextResponse.json({ success: true, data: { rates: FALLBACK_RATES, source: "fallback" } });
}
