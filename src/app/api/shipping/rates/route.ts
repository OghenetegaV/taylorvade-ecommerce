// src/app/api/shipping/rates/route.ts
// POST { address: { line1, city, state, country, postalCode?, name?, phone?, email? } }
// Creates a Terminal Africa delivery address + parcel (from the user's DB cart),
// then fetches live carrier rates. Returns a clean list for the checkout UI.
//
// Required env vars:
//   TERMINAL_SECRET_KEY         — from terminal.africa dashboard (use sk_test_* first)
//   TERMINAL_PICKUP_ADDRESS_ID  — the store's pickup address, created once in the dashboard
//
// Notes:
// - Item weight defaults to 0.5kg per unit (adjust DEFAULT_ITEM_WEIGHT_KG for real garments).
// - Rates are re-validated server-side at initialize time via GET /rates/:id,
//   so the client can't tamper with the delivery fee.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";

const TERMINAL_BASE = "https://api.terminal.africa/v1";
const DEFAULT_ITEM_WEIGHT_KG = 0.5;

function terminalHeaders() {
  return {
    Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
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

    // ── 1. Create delivery address on Terminal ───────────────────
    const [firstName, ...restName] = (address.name ?? profile?.fullName ?? "Taylor Vade Customer").trim().split(" ");
    const addrRes = await fetch(`${TERMINAL_BASE}/addresses`, {
      method: "POST",
      headers: terminalHeaders(),
      body: JSON.stringify({
        first_name: firstName,
        last_name: restName.join(" ") || firstName,
        email: profile?.email ?? user.email,
        phone: address.phone ?? profile?.phone ?? undefined,
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        state: address.state,
        country: address.country,   // ISO-2 (e.g. "NG") or full name — Terminal accepts ISO-2; we map below
        zip: address.postalCode || undefined,
      }),
    });
    const addrData = await addrRes.json();
    if (!addrRes.ok || !addrData?.data?.address_id) {
      return NextResponse.json(
        { success: false, error: addrData?.message ?? "Could not validate delivery address" },
        { status: 422 },
      );
    }
    const deliveryAddressId = addrData.data.address_id;

    // ── 2. Create parcel from cart ───────────────────────────────
    const parcelRes = await fetch(`${TERMINAL_BASE}/parcels`, {
      method: "POST",
      headers: terminalHeaders(),
      body: JSON.stringify({
        description: "Taylor Vade order",
        weight_unit: "kg",
        items: cartItems.map(i => ({
          name: i.product.name,
          description: i.product.name,
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
      return NextResponse.json(
        { success: false, error: parcelData?.message ?? "Could not prepare parcel" },
        { status: 502 },
      );
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
    });
    const ratesData = await ratesRes.json();
    if (!ratesRes.ok || !Array.isArray(ratesData?.data)) {
      return NextResponse.json(
        { success: false, error: ratesData?.message ?? "Could not fetch shipping rates" },
        { status: 502 },
      );
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

    if (rates.length === 0) {
      return NextResponse.json({ success: false, error: "No couriers available for this location" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { rates } });
  } catch (e) {
    console.error("shipping/rates:", e);
    return NextResponse.json({ success: false, error: "Could not fetch shipping rates" }, { status: 500 });
  }
}
