// src/lib/shipping.ts
// Flat zone-based shipping. Edit rates here — no external API needed.
// The server recomputes the fee from methodId so the client can't tamper with it.

export type ShippingMethod = {
  id: string;
  label: string;
  eta: string;          // human delivery estimate
  feeNGN: number;
};

export const FREE_SHIPPING_THRESHOLD_NGN = 250_000; // free *standard* shipping above this

const LAGOS_METHODS: ShippingMethod[] = [
  { id: "lagos-standard", label: "Standard — Lagos",      eta: "2–4 business days",  feeNGN: 2_500 },
  { id: "lagos-express",  label: "Express — Lagos",       eta: "24–48 hours",        feeNGN: 4_500 },
];

const NATIONWIDE_METHODS: ShippingMethod[] = [
  { id: "ng-standard",    label: "Standard — Nationwide", eta: "3–7 business days",  feeNGN: 4_000 },
];

const INTERNATIONAL_METHODS: ShippingMethod[] = [
  { id: "intl-courier",   label: "International Courier", eta: "5–10 business days", feeNGN: 45_000 },
];

export function getShippingMethods(country: string, state: string): ShippingMethod[] {
  if (country !== "Nigeria") return INTERNATIONAL_METHODS;
  if (state.trim().toLowerCase() === "lagos") return LAGOS_METHODS;
  return NATIONWIDE_METHODS;
}

/** Server-side: resolve a method by id and compute the true fee. Returns null if invalid for that zone. */
export function resolveShipping(methodId: string, country: string, state: string, subtotalNGN: number) {
  const method = getShippingMethods(country, state).find(m => m.id === methodId);
  if (!method) return null;
  const fee = method.id.includes("standard") && subtotalNGN >= FREE_SHIPPING_THRESHOLD_NGN
    ? 0
    : method.feeNGN;
  return { ...method, feeNGN: fee };
}

export const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara",
];

export const SHIPPING_COUNTRIES = [
  "Nigeria","Ghana","Kenya","South Africa","United Kingdom","United States",
  "Canada","France","Germany","Netherlands","United Arab Emirates",
];

/** Fallback code→name map, used when the Terminal Africa countries list is
 * unavailable so checkout never stores a raw ISO code ("NG") instead of a
 * full name ("Nigeria") as the order's address country. */
export const COUNTRY_CODE_NAMES: Record<string, string> = {
  NG: "Nigeria", GH: "Ghana", KE: "Kenya", ZA: "South Africa",
  GB: "United Kingdom", US: "United States", CA: "Canada",
  FR: "France", DE: "Germany", NL: "Netherlands", AE: "United Arab Emirates",
};
