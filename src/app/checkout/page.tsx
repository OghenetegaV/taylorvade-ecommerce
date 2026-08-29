// src/app/checkout/page.tsx
// v2 — cleaner + more legible:
// - Uses the MAIN site Header (no custom checkout header; spacer below matches
//   the fixed header height, same as CollectionPage)
// - Paystack only
// - Live Terminal Africa rates: fill address → "Get Shipping Rates" → pick courier
// - White cards on #fafafa, larger type throughout
// Flow: address → rates → pay (Paystack redirect) → /checkout/confirm verifies.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { COUNTRY_CODE_NAMES } from "@/lib/shipping";

/* ── Types ─────────────────────────────────────────────────────── */
type CartItem = {
  id: string;
  quantity: number;
  product: { id: string; name: string; slug: string; type: string; basePrice: number; images: { url: string }[] };
  variant: { id: string; colorLabel: string; size: string; sku: string; stockQuantity: number; priceOverride: number | null };
};
type Rate = {
  id: string; carrier: string; logo: string | null;
  amount: number; deliveryTime: string; pickupTime: string;
};
type Upsell = {
  id: string; name: string; slug: string; basePrice: number;
  images?: { url: string; isPrimary?: boolean }[];
  variants?: { id: string; size: string; colorLabel: string; stockQuantity: number }[];
};

const FREE_DELIVERY_THRESHOLD = 250000; // matches the Shipping Policy's free-delivery threshold

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

const inputCls =
  "w-full border border-[#d9d9d5] bg-white px-4 py-3 text-[15.5px] text-[#111] font-serif rounded-[3px] " +
  "outline-none focus:border-[#111] transition-colors placeholder:text-[#b5b5b0]";

const labelCls = "block text-[12.5px] tracking-[0.1em] uppercase text-[#767672] font-serif mb-1.5";

/* ── Page ──────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const router = useRouter();

  // Auth + cart
  const [authState, setAuthState] = useState<"loading" | "guest" | "authed">("loading");
  const [email, setEmail]         = useState("");
  const [items, setItems]         = useState<CartItem[]>([]);
  const [upsellBusy, setUpsellBusy] = useState<string | null>(null);
  const upsellScrollRef = useRef<HTMLDivElement>(null);
  const [cartLoaded, setCartLoaded] = useState(false);

  // Address form
  const [fullName, setFullName]         = useState("");
  const [phone, setPhone]               = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [countryCode, setCountryCode]   = useState("NG");
  const [countryOptions, setCountryOptions] = useState<{ name: string; code: string }[]>([]);
  const [city, setCity]                 = useState("");
  const [state, setState]               = useState("");
  const [stateCode, setStateCode]       = useState("");
  const [stateOptions, setStateOptions] = useState<{ name: string; code: string }[]>([]);
  const [cityOptions, setCityOptions]   = useState<{ name: string; code: string }[]>([]);
  const [locLoading, setLocLoading]     = useState(false);
  const [postalCode, setPostalCode]     = useState("");
  const [notes, setNotes]               = useState("");

  // Billing address (mirrors MDV's "Same as shipping" / "Use a different billing address")
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingFullName, setBillingFullName]         = useState("");
  const [billingAddressLine1, setBillingAddressLine1] = useState("");
  const [billingAddressLine2, setBillingAddressLine2] = useState("");
  const [billingCountryCode, setBillingCountryCode]   = useState("NG");
  const [billingCity, setBillingCity]                 = useState("");
  const [billingState, setBillingState]               = useState("");
  const [billingStateCode, setBillingStateCode]       = useState("");
  const [billingStateOptions, setBillingStateOptions] = useState<{ name: string; code: string }[]>([]);
  const [billingPostalCode, setBillingPostalCode]     = useState("");
  const [billingLocLoading, setBillingLocLoading]     = useState(false);

  const billingComplete =
    billingSameAsShipping ||
    (billingFullName.trim() && billingAddressLine1.trim() && billingCity.trim() && billingState.trim());

  // Load Terminal countries once.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/shipping/locations?type=countries")
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d.success) setCountryOptions(d.data); });
    return () => { cancelled = true; };
  }, []);

  // Load Terminal states whenever the chosen country changes.
  useEffect(() => {
    let cancelled = false;
    setStateOptions([]);
    setStateCode(""); setState("");
    setCityOptions([]); setCity("");
    if (!countryCode) return;
    setLocLoading(true);
    fetch(`/api/shipping/locations?type=states&country=${encodeURIComponent(countryCode)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d.success) setStateOptions(d.data); })
      .finally(() => { if (!cancelled) setLocLoading(false); });
    return () => { cancelled = true; };
  }, [countryCode]);

  // Load Terminal cities whenever the chosen state code changes.
  useEffect(() => {
    let cancelled = false;
    setCityOptions([]);
    setCity("");
    if (!stateCode || !countryCode) return;
    setLocLoading(true);
    fetch(`/api/shipping/locations?type=cities&country=${encodeURIComponent(countryCode)}&state_code=${encodeURIComponent(stateCode)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d.success) setCityOptions(d.data); })
      .finally(() => { if (!cancelled) setLocLoading(false); });
    return () => { cancelled = true; };
  }, [stateCode, countryCode]);

  // Billing states load only once the shopper opts into a different billing address.
  useEffect(() => {
    let cancelled = false;
    if (billingSameAsShipping || !billingCountryCode) { setBillingStateOptions([]); return; }
    setBillingLocLoading(true);
    fetch(`/api/shipping/locations?type=states&country=${encodeURIComponent(billingCountryCode)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d.success) setBillingStateOptions(d.data); })
      .finally(() => { if (!cancelled) setBillingLocLoading(false); });
    return () => { cancelled = true; };
  }, [billingCountryCode, billingSameAsShipping]);

  // Shipping rates (Terminal Africa)
  const [rates, setRates]             = useState<Rate[]>([]);
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError]     = useState<string | null>(null);

  // Discount code
  const [discountInput, setDiscountInput]     = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountError, setDiscountError]     = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<
    { code: string; amount: number } | null
  >(null);

  // Submit
  const [paying, setPaying] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Upsells
  const [upsells, setUpsells] = useState<Upsell[]>([]);

  /* ── Data loading ────────────────────────────────────────────── */
  const fetchCart = useCallback(async () => {
    const r = await fetch("/api/cart");
    const d = await r.json();
    if (d.success) setItems(d.data.items);
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthState("authed");
        setEmail(session.user.email ?? "");
        setFullName(prev => prev || (session.user.user_metadata?.full_name ?? ""));
      } else {
        setAuthState("guest");
      }
    });
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (!cartLoaded) return;
    const inCart = new Set(items.map(i => i.product.id));
    fetch("/api/products?limit=8&sortBy=createdAt&order=desc")
      .then(r => r.json())
      .then(d => {
        if (!d.success) return;
        setUpsells((d.data.products ?? d.data ?? []).filter((p: Upsell) => !inCart.has(p.id)).slice(0, 6));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartLoaded, items.length]);

  /* ── Money ───────────────────────────────────────────────────── */
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.variant.priceOverride ?? i.product.basePrice) * i.quantity, 0),
    [items],
  );
  const shippingFee = selectedRate?.amount ?? 0;
  const discountAmount = appliedDiscount?.amount ?? 0;
  const total = Math.max(0, subtotal - discountAmount) + shippingFee;

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const addressComplete =
    emailValid && fullName.trim() && phone.trim() && addressLine1.trim() && city.trim() && state.trim();

  /* ── GA4 ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!cartLoaded || items.length === 0) return;
    sendGAEvent("event", "begin_checkout", {
      currency: "NGN",
      value: subtotal,
      items: items.map(i => ({
        item_id: i.product.id,
        item_name: i.product.name,
        item_variant: `${i.variant.colorLabel} / ${i.variant.size}`,
        price: Number(i.variant.priceOverride ?? i.product.basePrice),
        quantity: i.quantity,
      })),
    });
  // fire once when the cart first loads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartLoaded]);

  /* ── Address edits invalidate fetched rates ──────────────────── */
  function onAddressChange<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      if (rates.length > 0 || selectedRate) {
        setRates([]);
        setSelectedRate(null);
      }
    };
  }

  /* ── Terminal Africa rates ───────────────────────────────────── */
  async function fetchRates() {
    if (!addressComplete) return;
    setRatesLoading(true);
    setRatesError(null);
    setRates([]);
    setSelectedRate(null);
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            name: fullName, phone,
            line1: addressLine1, line2: addressLine2,
            city, state, stateCode, country: countryCode, postalCode,
          },
        }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error ?? "Could not fetch rates");
      setRates(d.data.rates);
      if (d.data.rates[0]) selectRate(d.data.rates[0]);
    } catch (e) {
      setRatesError(e instanceof Error ? e.message : "Could not fetch shipping rates. Please check the address and try again.");
    } finally {
      setRatesLoading(false);
    }
  }

  function selectRate(rate: Rate) {
    setSelectedRate(rate);
    sendGAEvent("event", "add_shipping_info", {
      currency: "NGN", value: subtotal, shipping_tier: rate.carrier,
    });
  }

  /* ── Discount code ───────────────────────────────────────────── */
  async function applyDiscount() {
    if (!discountInput.trim()) return;
    setApplyingDiscount(true);
    setDiscountError(null);
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountInput.trim(), subtotal }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error ?? "Invalid code");
      setAppliedDiscount({ code: d.data.code, amount: d.data.amount });
    } catch (e) {
      setAppliedDiscount(null);
      setDiscountError(e instanceof Error ? e.message : "Could not apply code");
    } finally {
      setApplyingDiscount(false);
    }
  }
  function removeDiscount() {
    setAppliedDiscount(null);
    setDiscountInput("");
    setDiscountError(null);
  }

  // A single-variant upsell can be added in one tap; anything with a real
  // size/colour choice sends the shopper to the product page instead.
  function singleVariant(p: Upsell) {
    const inStock = (p.variants ?? []).filter(v => v.stockQuantity > 0);
    return inStock.length === 1 ? inStock[0] : null;
  }

  async function addUpsell(p: Upsell) {
    const variant = singleVariant(p);
    if (!variant) return;
    setUpsellBusy(p.id);
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, variantId: variant.id, quantity: 1 }),
      });
      await fetchCart();
      setRates([]); setSelectedRate(null);
      window.dispatchEvent(new Event("cartUpdated"));
    } finally {
      setUpsellBusy(null);
    }
  }

  /* ── Pay ─────────────────────────────────────────────────────── */
  async function handlePay() {
    setError(null);
    if (!addressComplete) {
      setError("Please complete all required delivery fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!selectedRate) {
      setError("Please fetch shipping rates and choose a courier.");
      return;
    }
    if (!billingComplete) {
      setError("Please complete the billing address, or switch it back to match shipping.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setPaying(true);
    try {
      const shippingAddress = {
        fullName, phone, addressLine1, addressLine2,
        city, state, stateCode,
        country: countryOptions.find(c => c.code === countryCode)?.name
          ?? COUNTRY_CODE_NAMES[countryCode]
          ?? countryCode,
        countryCode,
        postalCode,
      };
      const billingAddress = billingSameAsShipping
        ? shippingAddress
        : {
            fullName: billingFullName, phone,
            addressLine1: billingAddressLine1, addressLine2: billingAddressLine2,
            city: billingCity, state: billingState, stateCode: billingStateCode,
            country: countryOptions.find(c => c.code === billingCountryCode)?.name
              ?? COUNTRY_CODE_NAMES[billingCountryCode]
              ?? billingCountryCode,
            countryCode: billingCountryCode,
            postalCode: billingPostalCode,
          };

      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rateId: selectedRate.id,
          notes,
          email,
          discountCode: appliedDiscount?.code,
          address: shippingAddress,
          billingAddress,
          billingSameAsShipping,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Could not start payment");
      window.location.href = data.data.paymentUrl; // Paystack hosted page
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPaying(false);
    }
  }

  /* ── Gates ───────────────────────────────────────────────────── */
  if (authState === "loading" || !cartLoaded) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-serif">
        <p className="text-[13.5px] tracking-[0.25em] uppercase text-[#8f8f8a]">Loading…</p>
      </div>
    );
  }

  // Guest checkout is allowed — no sign-in gate. Logged-in users still get their
  // email prefilled; guests simply type theirs in the Contact section.

  if (items.length === 0) {
    return (
      <Gate
        title="Your bag is empty"
        body="Add something you love, then come back — we'll be here."
        cta={{ label: "Shop the Collection", onClick: () => router.push("/collections/woman") }}
      />
    );
  }

  /* ── Layout ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#fafafa] font-serif">
      {/* Spacer for the main fixed Header */}
      <div className="h-[76px] md:h-[88px]" />

      <div className="max-w-6xl mx-auto px-5 md:px-8 pt-8 md:pt-12 pb-16">
        {/* Page title */}
        <div className="mb-8 md:mb-10">
          <h1 className="text-[26px] md:text-[32px] text-[#111]"
            style={{ fontFamily: "var(--font-script), cursive" }}>
            Checkout
          </h1>
          <p className="text-[14.5px] text-[#767672] mt-1">
            Delivery within Nigeria · Secure payment by Paystack
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-12">

          {/* ══ LEFT — form ══════════════════════════════════════ */}
          <div className="space-y-6 min-w-0">

            {error && (
              <div className="px-5 py-4 border border-[#111] rounded-[3px] bg-white text-[15px] text-[#111]">
                {error}
              </div>
            )}

            {/* 1 · Contact */}
            <Card title="Contact"
              action={authState === "guest" && (
                <Link href="/login?next=/checkout" className="text-[13.5px] text-[#111] underline underline-offset-2 hover:opacity-60 transition-opacity">
                  Sign in
                </Link>
              )}>
              <div>
                <label className={labelCls}>Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={inputCls}
                />
              </div>
            </Card>

            {/* 2 · Delivery */}
            <Card title="Delivery">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelCls}>Country *</label>
                  <select
                    value={countryCode}
                    onChange={e => {
                      setCountryCode(e.target.value);
                      setRates([]); setSelectedRate(null);
                    }}
                    className={inputCls}
                  >
                    <option value="" disabled>Select Country</option>
                    {countryOptions.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Full Name *</label>
                  <input value={fullName} onChange={e => onAddressChange(setFullName)(e.target.value)} className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Street Address *</label>
                  <input value={addressLine1} onChange={e => onAddressChange(setAddressLine1)(e.target.value)}
                    placeholder="House number and street" className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Apartment, Suite, etc. (optional)</label>
                  <input value={addressLine2} onChange={e => onAddressChange(setAddressLine2)(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State *</label>
                  <select
                    value={stateCode}
                    onChange={e => {
                      const code = e.target.value;
                      const name = stateOptions.find(s => s.code === code)?.name || "";
                      setStateCode(code);
                      setState(name);
                      setRates([]); setSelectedRate(null);
                    }}
                    className={inputCls}
                  >
                    <option value="" disabled>{locLoading ? "Loading states..." : "Select State"}</option>
                    {stateOptions.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>City *</label>
                  {cityOptions.length > 0 ? (
                    <select
                      value={city}
                      onChange={e => { onAddressChange(setCity)(e.target.value); }}
                      className={inputCls}
                    >
                      <option value="" disabled>{locLoading ? "Loading cities..." : "Select City"}</option>
                      {cityOptions.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                    </select>
                  ) : (
                    <input
                      value={city}
                      onChange={e => onAddressChange(setCity)(e.target.value)}
                      placeholder={locLoading ? "Loading cities..." : "City"}
                      className={inputCls}
                    />
                  )}
                </div>
                <div>
                  <label className={labelCls}>Postal Code (optional)</label>
                  <input value={postalCode} onChange={e => onAddressChange(setPostalCode)(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone *</label>
                  <input value={phone} onChange={e => onAddressChange(setPhone)(e.target.value)}
                    placeholder="+234 801 234 5678" className={inputCls} />
                </div>
              </div>

              {/* Get rates */}
              <button
                type="button"
                onClick={fetchRates}
                disabled={!addressComplete || ratesLoading}
                className="mt-5 w-full border border-[#111] rounded-[3px] bg-white text-[#111] text-[13.5px]
                  tracking-[0.2em] uppercase py-4 hover:bg-[#111] hover:text-white
                  transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#111]"
              >
                {ratesLoading ? "Fetching couriers…" : "Get Shipping Rates"}
              </button>
              {!addressComplete && (
                <p className="text-[13.5px] text-[#8f8f8a] mt-2">
                  Complete the required fields above to fetch delivery options.
                </p>
              )}
            </Card>

            {/* 3 · Shipping method */}
            <Card title="Shipping Method">
              {ratesLoading ? (
                <p className="text-[15px] text-[#767672] py-2">Contacting couriers…</p>
              ) : rates.length === 0 ? (
                <p className="text-[15px] text-[#767672] py-2">
                  {ratesError ?? "Enter your delivery address above to see available shipping methods."}
                </p>
              ) : (
                <div className="space-y-3">
                  {rates.map(rate => {
                    const selected = selectedRate?.id === rate.id;
                    return (
                      <button key={rate.id} type="button" onClick={() => selectRate(rate)}
                        className={`w-full flex items-center justify-between gap-4 px-5 py-4 border rounded-[3px] text-left transition-colors ${
                          selected ? "border-[#111] bg-[#fbfbfa]" : "border-[#d4d4d0] bg-white hover:border-[#8f8f8a]"
                        }`}>
                        <span className="flex items-center gap-4 min-w-0">
                          <span className={`w-[16px] h-[16px] rounded-full border flex-shrink-0 ${
                            selected ? "border-[#111] bg-[#111] shadow-[inset_0_0_0_3.5px_#fff]" : "border-[#b5b5b0]"
                          }`} />
                          {rate.logo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={rate.logo} alt={rate.carrier} className="h-6 w-auto flex-shrink-0" />
                          )}
                          <span className="min-w-0">
                            <span className="block text-[15.5px] text-[#111] truncate">{rate.carrier}</span>
                            {rate.deliveryTime && (
                              <span className="block text-[13.5px] text-[#767672] mt-0.5">{rate.deliveryTime}</span>
                            )}
                          </span>
                        </span>
                        <span className="text-[15.5px] text-[#111] flex-shrink-0">{fmt(rate.amount)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {ratesError && rates.length === 0 && !ratesLoading && (
                <p className="text-[14px] text-[#8f8f8a] mt-3">
                  Double-check the street, city, and state, then try again.
                </p>
              )}
            </Card>

            {/* Selected for You — free-delivery progress + quick-add upsells */}
            {upsells.length > 0 && (
              <Card title="Selected for You">
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex-1">
                    <div className="h-[3px] bg-[#e5e5e2] overflow-hidden rounded-full">
                      <div className="h-full bg-[#111] transition-all duration-500"
                        style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }} />
                    </div>
                    <p className="text-[13px] text-[#111] font-serif mt-2.5">
                      {subtotal >= FREE_DELIVERY_THRESHOLD
                        ? "You've unlocked free delivery!"
                        : `Free delivery is ${fmt(FREE_DELIVERY_THRESHOLD - subtotal)} away!`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button type="button" aria-label="Scroll left"
                      onClick={() => upsellScrollRef.current?.scrollBy({ left: -160, behavior: "smooth" })}
                      className="w-8 h-8 flex items-center justify-center border border-[#d4d4d0] rounded-[3px] hover:border-[#111] transition-colors">
                      ←
                    </button>
                    <button type="button" aria-label="Scroll right"
                      onClick={() => upsellScrollRef.current?.scrollBy({ left: 160, behavior: "smooth" })}
                      className="w-8 h-8 flex items-center justify-center border border-[#d4d4d0] rounded-[3px] hover:border-[#111] transition-colors">
                      →
                    </button>
                  </div>
                </div>

                <div ref={upsellScrollRef} className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1"
                  style={{ scrollbarWidth: "none" }}>
                  {upsells.map(p => {
                    const img = p.images?.find(i => i.isPrimary)?.url ?? p.images?.[0]?.url;
                    const variant = singleVariant(p);
                    const busy = upsellBusy === p.id;
                    return (
                      <div key={p.id} className="flex-shrink-0 w-[150px]">
                        <Link href={`/products/${p.slug}`} className="group block">
                          <div className="relative aspect-[3/4] rounded-[3px] bg-[#f5f5f4] overflow-hidden">
                            {img && <Image src={img} alt={p.name} fill
                              className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500" sizes="150px" />}
                          </div>
                          <p className="text-[13.5px] text-[#111] mt-2 truncate">{p.name}</p>
                          <p className="text-[13px] text-[#767672]">{fmt(Number(p.basePrice))}</p>
                        </Link>
                        {variant ? (
                          <button type="button" onClick={() => addUpsell(p)} disabled={busy}
                            className="mt-2 w-full bg-[#111] text-white text-[11px] tracking-[0.14em] uppercase
                              font-serif py-2.5 hover:bg-black transition-colors disabled:opacity-50">
                            {busy ? "Adding…" : "Add"}
                          </button>
                        ) : (
                          <Link href={`/products/${p.slug}`}
                            className="mt-2 block w-full text-center bg-[#111] text-white text-[11px] tracking-[0.14em] uppercase
                              font-serif py-2.5 hover:bg-black transition-colors">
                            Select
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* 4 · Payment */}
            <Card title="Payment">
              <p className="text-[13.5px] text-[#8f8f8a] mb-4">All transactions are secure and encrypted.</p>
              <div className="border border-[#111] rounded-[3px] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 bg-[#fbfbfa]">
                  <span className="w-[16px] h-[16px] rounded-full border border-[#111] bg-[#111]
                    shadow-[inset_0_0_0_3px_#fff] flex-shrink-0" />
                  <p className="text-[15.5px] text-[#111]">Paystack — Secure Checkout</p>
                  <span className="ml-auto text-[12.5px] tracking-[0.1em] uppercase text-[#767672]">
                    Card · Transfer · USSD · Opay
                  </span>
                </div>
                <p className="px-5 py-3 text-[14px] text-[#8f8f8a] border-t border-[#e5e5e2]">
                  You&apos;ll be redirected to Paystack&apos;s secure page to complete your purchase.
                  We never see or store your card details.
                </p>
              </div>
            </Card>

            {/* 4b · Billing address */}
            <Card title="Billing Address">
              <div className="space-y-3">
                <button type="button" onClick={() => setBillingSameAsShipping(true)}
                  className={`w-full flex items-center gap-4 px-5 py-4 border rounded-[3px] text-left transition-colors ${
                    billingSameAsShipping ? "border-[#111] bg-[#fbfbfa]" : "border-[#d4d4d0] bg-white hover:border-[#8f8f8a]"
                  }`}>
                  <span className={`w-[16px] h-[16px] rounded-full border flex-shrink-0 ${
                    billingSameAsShipping ? "border-[#111] bg-[#111] shadow-[inset_0_0_0_3.5px_#fff]" : "border-[#b5b5b0]"
                  }`} />
                  <span className="text-[15.5px] text-[#111]">Same as shipping address</span>
                </button>
                <button type="button" onClick={() => setBillingSameAsShipping(false)}
                  className={`w-full flex items-center gap-4 px-5 py-4 border rounded-[3px] text-left transition-colors ${
                    !billingSameAsShipping ? "border-[#111] bg-[#fbfbfa]" : "border-[#d4d4d0] bg-white hover:border-[#8f8f8a]"
                  }`}>
                  <span className={`w-[16px] h-[16px] rounded-full border flex-shrink-0 ${
                    !billingSameAsShipping ? "border-[#111] bg-[#111] shadow-[inset_0_0_0_3.5px_#fff]" : "border-[#b5b5b0]"
                  }`} />
                  <span className="text-[15.5px] text-[#111]">Use a different billing address</span>
                </button>
              </div>

              {!billingSameAsShipping && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t border-[#e5e5e2]">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Country *</label>
                    <select value={billingCountryCode}
                      onChange={e => { setBillingCountryCode(e.target.value); setBillingStateCode(""); setBillingState(""); }}
                      className={inputCls}>
                      <option value="" disabled>Select Country</option>
                      {countryOptions.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Full Name *</label>
                    <input value={billingFullName} onChange={e => setBillingFullName(e.target.value)} className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Street Address *</label>
                    <input value={billingAddressLine1} onChange={e => setBillingAddressLine1(e.target.value)}
                      placeholder="House number and street" className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Apartment, Suite, etc. (optional)</label>
                    <input value={billingAddressLine2} onChange={e => setBillingAddressLine2(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>State *</label>
                    <select value={billingStateCode}
                      onChange={e => {
                        const code = e.target.value;
                        const name = billingStateOptions.find(s => s.code === code)?.name || "";
                        setBillingStateCode(code); setBillingState(name);
                      }}
                      className={inputCls}>
                      <option value="" disabled>{billingLocLoading ? "Loading states..." : "Select State"}</option>
                      {billingStateOptions.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>City *</label>
                    <input value={billingCity} onChange={e => setBillingCity(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Postal Code (optional)</label>
                    <input value={billingPostalCode} onChange={e => setBillingPostalCode(e.target.value)} className={inputCls} />
                  </div>
                </div>
              )}
            </Card>

            {/* 5 · Notes */}
            <Card title="Order Notes (optional)">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Delivery instructions, gift note…" className={`${inputCls} resize-none`} />
            </Card>
          </div>

          {/* ══ RIGHT — summary ══════════════════════════════════ */}
          <aside className="bg-[#eeeeee] lg:h-full">
            <div className="lg:sticky lg:top-[104px] p-6">
              <div className="space-y-5 max-h-[360px] overflow-y-auto pr-1">
                {items.map(item => {
                  const price = Number(item.variant.priceOverride ?? item.product.basePrice);
                  return (
                    <div key={item.id} className="flex gap-4">
                      <Link href={`/products/${item.product.slug}`}
                        className="relative w-[56px] h-[74px] flex-shrink-0 rounded-[3px] bg-[#e8e8e6] overflow-hidden">
                        {item.product.images[0] && (
                          <Image src={item.product.images[0].url} alt={item.product.name}
                            fill className="object-cover object-top" sizes="56px" />
                        )}
                        <span className="absolute -top-1.5 -left-1.5 w-[18px] h-[18px] rounded-full bg-[#111]
                          text-white text-[10px] flex items-center justify-center leading-none">
                          {item.quantity}
                        </span>
                      </Link>
                      <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] text-[#666666] leading-snug">
                            <span className="font-semibold">{item.product.name}</span>
                            {item.product.type && <> — {item.product.type}</>} — {item.variant.colorLabel}
                          </p>
                          <p className="text-[12.5px] text-[#666666] mt-1">
                            {item.variant.size} / {item.variant.colorLabel} / {item.variant.sku}
                          </p>
                        </div>
                        <span className="text-[14px] text-[#666666] flex-shrink-0">{fmt(price * item.quantity)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Discount code */}
              <div className="border-t border-[#d9d9d5] mt-6 pt-5">
                {appliedDiscount ? (
                  <div className="flex items-center justify-between px-3 py-2.5 border border-[#999999] rounded-[3px] bg-[#e5e5e5] text-[14px]">
                    <span className="text-[#666666]">Code <b>{appliedDiscount.code}</b> applied</span>
                    <button type="button" onClick={removeDiscount}
                      className="text-[12.5px] text-[#666666] underline underline-offset-2 hover:text-[#111]">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={discountInput} onChange={e => setDiscountInput(e.target.value)}
                      placeholder="Discount code"
                      className="flex-1 border border-[#d9d9d5] rounded-[3px] bg-white px-3.5 py-2.5 text-[14px] text-[#666666]
                        outline-none focus:border-[#111] transition-colors placeholder:text-[#999999]" />
                    <button type="button" onClick={applyDiscount}
                      disabled={applyingDiscount || !discountInput.trim()}
                      className="px-4 border border-[#999999] rounded-[3px] text-[12.5px] tracking-[0.14em] uppercase
                        text-[#666666] hover:bg-[#111] hover:text-white hover:border-[#111] transition-colors disabled:opacity-40">
                      {applyingDiscount ? "…" : "Apply"}
                    </button>
                  </div>
                )}
                {discountError && <p className="text-[13px] text-red-700 mt-2">{discountError}</p>}
              </div>

              <div className="mt-5 pt-5 space-y-2.5">
                <Row label="Subtotal" value={fmt(subtotal)} />
                {appliedDiscount && (
                  <Row label="Discount" value={`− ${fmt(discountAmount)}`} />
                )}
                <Row label="Shipping"
                  value={selectedRate ? fmt(shippingFee) : "Enter shipping address"}
                  muted={!selectedRate} />
                <div className="flex items-center justify-between pt-3 border-t border-[#d9d9d5] mt-3 mb-1">
                  <span className="text-[14.5px] font-semibold text-[#666666]">Total</span>
                  <span className="text-[20px] text-[#666666]">{fmt(total)}</span>
                </div>
              </div>

              <div className="mt-5">
                <PayButton paying={paying} ready={!!selectedRate} total={total} onClick={handlePay} />
              </div>

              <div className="flex items-center justify-center gap-4 mt-4">
                <Link href="/returns" className="text-[12.5px] text-[#666666] underline underline-offset-2 hover:text-[#111]">
                  Refund Policy
                </Link>
                <Link href="/shipping-policy" className="text-[12.5px] text-[#666666] underline underline-offset-2 hover:text-[#111]">
                  Shipping
                </Link>
                <Link href="/terms" className="text-[12.5px] text-[#666666] underline underline-offset-2 hover:text-[#111]">
                  Terms of Service
                </Link>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}

/* ── Small pieces ──────────────────────────────────────────────── */
function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#e5e5e2] rounded-[3px] p-6 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[16px] font-semibold text-[#111]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, hint, muted }: { label: string; value: string; hint?: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14.5px] text-[#666666]">{label}</span>
      <span className={`text-[15px] ${muted ? "text-[#999999]" : "text-[#666666]"}`}>
        {value}{hint && <span className="text-[12.5px] text-[#999999] ml-2">{hint}</span>}
      </span>
    </div>
  );
}

function PayButton({ paying, ready, total, onClick }: {
  paying: boolean; ready: boolean; total: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={paying || !ready}
      className="w-full bg-[#111] text-white text-[13.5px] tracking-[0.25em] uppercase py-4 rounded-[3px]
        hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
      {paying ? "Redirecting to Paystack…" : ready ? `Pay ${fmt(total)}` : "Select delivery to continue"}
    </button>
  );
}

function Gate({ title, body, cta }: {
  title: string; body: string; cta: { label: string; onClick: () => void };
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] font-serif">
      <div className="h-[76px] md:h-[88px]" />
      <div className="flex items-center justify-center px-6 py-28">
        <div className="text-center max-w-sm">
          <p className="text-[32px] text-[#111] mb-3" style={{ fontFamily: "var(--font-script), cursive" }}>
            {title}
          </p>
          <p className="text-[15px] text-[#767672] leading-relaxed mb-7">{body}</p>
          <button onClick={cta.onClick}
            className="bg-[#111] text-white text-[13.5px] tracking-[0.22em] uppercase px-8 py-4 hover:bg-black transition-colors">
            {cta.label}
          </button>
        </div>
      </div>
    </div>
  );
}
