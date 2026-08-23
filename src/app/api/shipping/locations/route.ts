// src/app/api/shipping/locations/route.ts
// Serves Terminal Africa's own STATES and CITIES so the checkout dropdowns are
// fed by Terminal's exact codes/names — guaranteeing the state & city sent when
// creating a delivery address are always valid (fixes "Invalid city").
//
//   GET /api/shipping/locations?type=states&country=NG
//   GET /api/shipping/locations?type=cities&country=NG&state_code=LA
//
// Returns { success, data: TLoc[] }  where TLoc = { name, code }
// (cities return code === name, since Terminal cities are matched by name).

import { NextRequest, NextResponse } from "next/server";

const TERMINAL_BASE = "https://api.terminal.africa/v1";

function headers() {
  return {
    Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "states" | "cities"
    const country = searchParams.get("country") || "NG";
    const stateCode = searchParams.get("state_code") || "";

    if (!process.env.TERMINAL_SECRET_KEY) {
      return NextResponse.json({ success: true, data: [] });
    }

    if (type === "states") {
      const res = await fetch(
        `${TERMINAL_BASE}/states?country_code=${encodeURIComponent(country)}`,
        { headers: headers(), cache: "no-store" },
      );
      const data = await res.json();
      const raw = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.data?.states)
        ? data.data.states
        : [];
      const states = raw
        .map((s: any) => ({
          name: s?.name || s?.state || "",
          code: s?.isoCode || s?.state_code || s?.code || s?.slug || "",
        }))
        .filter((s: any) => s.name && s.code);

      const seen = new Set<string>();
      const unique = states
        .filter((s: any) => (seen.has(s.code) ? false : (seen.add(s.code), true)))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      return NextResponse.json({ success: true, data: unique });
    }

    if (type === "cities") {
      const params = new URLSearchParams({ country_code: country });
      if (stateCode) params.set("state_code", stateCode);
      const res = await fetch(`${TERMINAL_BASE}/cities?${params.toString()}`, {
        headers: headers(),
        cache: "no-store",
      });
      const data = await res.json();
      const raw = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.data?.cities)
        ? data.data.cities
        : [];
      const cities = raw
        .map((c: any) => (typeof c === "string" ? c : c?.name || c?.city))
        .filter(Boolean);
      const unique = Array.from(new Set<string>(cities))
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ name, code: name }));

      return NextResponse.json({ success: true, data: unique });
    }

    return NextResponse.json(
      { success: false, error: "Invalid type" },
      { status: 400 },
    );
  } catch (e) {
    console.error("shipping/locations:", e);
    return NextResponse.json({ success: true, data: [] });
  }
}
