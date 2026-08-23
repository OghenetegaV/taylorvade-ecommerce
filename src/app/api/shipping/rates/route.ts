// src/app/api/shipping/rates/route.ts
// POST { address: { line1, line2?, city, state, stateCode?, country, postalCode?, name?, phone?, email? } }
// Creates a Terminal Africa delivery address + parcel (from the user's DB cart),
// then fetches live carrier rates. Falls back to flat zone rates (src/lib/shipping.ts)
// if Terminal is unconfigured, errors, or returns nothing — so checkout never breaks.
//
// Required env vars:
//   TERMINAL_SECRET_KEY         — Taylor Vade's Terminal key (sk_test_* first)
//   TERMINAL_PICKUP_ADDRESS_ID  — Taylor Vade's pickup address (AD-xxxx), created once

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";
import { getShippingMethods } from "@/lib/shipping";

const TERMINAL_BASE = "https://api.terminal.africa/v1";
const DEFAULT_ITEM_WEIGHT_KG = 0.5;

function terminalHeaders() {
  return {
    Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

// Convert a phone number to international format (Terminal requires it).
function toInternationalPhone(phone: string, countryCode: string): string {
  const raw = (phone || "").replace(/[\s()-]/g, "");
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("00")) return "+" + raw.slice(2);
  const dial: Record<string, string> = {
    NG: "234", US: "1", CA: "1", GB: "44", GH: "233", KE: "254",
    ZA: "27", FR: "33", DE: "49", NL: "31", AE: "971",
  };
  const code = dial[countryCode] || "234";
  let local = raw;
  if (local.startsWith("0")) local = local.slice(1);
  if (local.startsWith(code)) return "+" + local;
  return "+" + code + local;
}

// Flat-rate fallback shaped like the Terminal rate list the UI expects.
function flatFallback(country: string, state: string) {
  const countryName = country === "NG" ? "Nigeria" : country;
  const methods = getShippingMethods(countryName, state);
  return methods.map((m) => ({
    id: m.id,
    carrier: m.label,
    logo: null,
    amount: m.feeNGN,
    deliveryTime: m.eta,
    pickupTime: "",
  }));
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { address } = await req.json();
    if (!address?.line1 || !address?.city || !address?.state || !address?.country) {
      return NextResponse.json({ success: false, error: "Incomplete address" }, { status: 400 });
    }

    // ── Cart → parcel contents ───────────────────────────────────
    const cartItems = await prisma.cartItem.findMany({
      where: { profileId: user.id },
      include: {
        product: { select: { name: true, basePrice: true } },
        variant: { select: { priceOverride: true } },
      },
    });
    if (!cartItems.length) {
      return NextResponse.json({ success: false, error: "Your bag is empty" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    const countryCode = address.country || "NG";

    // Helper: return flat fallback as a successful response.
    const respondFallback = () => {
      const rates = flatFallback(countryCode, address.state);
      if (!rates.length) {
        return NextResponse.json(
          { success: false, error: "No couriers available for this location" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: { rates, source: "flat" } });
    };

    // If Terminal isn't configured, go straight to flat rates.
    if (!process.env.TERMINAL_SECRET_KEY || !process.env.TERMINAL_PICKUP_ADDRESS_ID) {
      return respondFallback();
    }

    try {
      // ── 1. Create delivery address on Terminal ───────────────────
      const [firstName, ...restName] = (address.name ?? profile?.fullName ?? "Taylor Vade Customer").trim().split(" ");
      const line1 = String(address.line1).slice(0, 45);
      const line2Overflow = String(address.line1).length > 45 ? String(address.line1).slice(45, 90) : "";
      const addrRes = await fetch(`${TERMINAL_BASE}/addresses`, {
        method: "POST",
        headers: terminalHeaders(),
        cache: "no-store",
        body: JSON.stringify({
          first_name: firstName,
          last_name: restName.join(" ") || firstName,
          email: profile?.email ?? user.email,
          phone: toInternationalPhone(address.phone ?? profile?.phone ?? "", countryCode),
          line1,
          line2: address.line2 || line2Overflow || undefined,
          city: address.city,
          state: address.state,
          country: countryCode,
          zip: address.postalCode || undefined,
        }),
      });
      const addrData = await addrRes.json();
      if (!addrRes.ok || !addrData?.data?.address_id) {
        console.error("Terminal address failed:", addrData?.message);
        return respondFallback();
      }
      const deliveryAddressId = addrData.data.address_id;

      // ── 2. Create parcel from cart ───────────────────────────────
      const parcelRes = await fetch(`${TERMINAL_BASE}/parcels`, {
        method: "POST",
        headers: terminalHeaders(),
        cache: "no-store",
        body: JSON.stringify({
          description: cartItems.length === 1 ? cartItems[0].product.name : `Taylor Vade order — ${cartItems.length} items`,
          weight_unit: "kg",
          items: cartItems.map((i) => ({
            name: i.product.name || "Clothing item",
            description: i.product.name || "Fashion / clothing item",
            type: "parcel",
            currency: "NGN",
            value: Number(i.variant.priceOverride ?? i.product.basePrice),
            quantity: i.quantity,
            weight: DEFAULT_ITEM_WEIGHT_KG,
          })),
        }),
      });
      const parcelData = await parcelRes.json();
      if (!parcelRes.ok || !parcelData?.data?.parcel_id) {
        console.error("Terminal parcel failed:", parcelData?.message);
        return respondFallback();
      }
      const parcelId = parcelData.data.parcel_id;

      // ── 3. Fetch rates ───────────────────────────────────────────
      const params = new URLSearchParams({
        pickup_address: process.env.TERMINAL_PICKUP_ADDRESS_ID!,
        delivery_address: deliveryAddressId,
        parcel_id: parcelId,
        currency: "NGN",
      });
      const ratesRes = await fetch(`${TERMINAL_BASE}/rates/shipment?${params}`, {
        headers: terminalHeaders(),
        cache: "no-store",
      });
      const ratesData = await ratesRes.json();
      if (!ratesRes.ok || !Array.isArray(ratesData?.data)) {
        console.error("Terminal rates failed:", ratesData?.message);
        return respondFallback();
      }

      const rates = ratesData.data
        .map((r: Record<string, unknown>) => ({
          id: r.rate_id ?? r.id,
          carrier: r.carrier_name ?? "Courier",
          logo: r.carrier_logo ?? null,
          amount: Number(r.amount),
          deliveryTime: r.delivery_time ?? r.delivery_eta ?? "",
          pickupTime: r.pickup_time ?? "",
        }))
        .filter((r: { id?: string; amount: number }) => r.id && Number.isFinite(r.amount))
        .sort((a: { amount: number }, b: { amount: number }) => a.amount - b.amount);

      if (rates.length === 0) return respondFallback();

      return NextResponse.json({ success: true, data: { rates, source: "terminal" } });
    } catch (err) {
      console.error("Terminal error, using flat fallback:", err);
      return respondFallback();
    }
  } catch (e) {
    console.error("shipping/rates:", e);
    return NextResponse.json({ success: false, error: "Could not fetch shipping rates" }, { status: 500 });
  }
}
