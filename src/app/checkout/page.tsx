// src/app/checkout/page.tsx
// v2 — cleaner + more legible:
// - Uses the MAIN site Header (no custom checkout header; spacer below matches
//   the fixed header height, same as CollectionPage)
// - Paystack only
// - Live Terminal Africa rates: fill address → "Get Shipping Rates" → pick courier
// - White cards on #fafafa, larger type throughout
// Flow: address → rates → pay (Paystack redirect) → /checkout/confirm verifies.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  product: { id: string; name: string; slug: string; basePrice: number; images: { url: string }[] };
  variant: { id: string; colorLabel: string; size: string; stockQuantity: number; priceOverride: number | null };
};
type Rate = {
  id: string; carrier: string; logo: string | null;
  amount: number; deliveryTime: string; pickupTime: string;
};
type Upsell = {
  id: string; name: string; slug: string; basePrice: number;
  images?: { url: string; isPrimary?: boolean }[];
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

const inputCls =
  "w-full border border-[#d4d4d0] bg-white px-4 py-3.5 text-[14px] text-[#111] font-serif " +
  "outline-none focus:border-[#111] transition-colors placeholder:text-[#b5b5b0] rounded-none";

const labelCls = "block text-[11px] tracking-[0.14em] uppercase text-[#767672] font-serif mb-2";

/* ── Page ──────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const router = useRouter();

  // Auth + cart
  const [authState, setAuthState] = useState<"loading" | "guest" | "authed">("loading");
  const [email, setEmail]         = useState("");
  const [items, setItems]         = useState<CartItem[]>([]);
  const [cartBusy, setCartBusy]   = useState<string | null>(null);
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
        setUpsells((d.data.products ?? d.data ?? []).filter((p: Upsell) => !inCart.has(p.id)).slice(0, 2));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartLoaded]);

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

  /* ── Cart editing (same endpoints as CartSidebar) ────────────── */
  async function updateQty(cartItemId: string, quantity: number) {
    setCartBusy(cartItemId);
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId, quantity }),
    });
    await fetchCart();
    setRates([]); setSelectedRate(null); // parcel changed → rates stale
    setCartBusy(null);
  }
  async function removeItem(cartItemId: string) {
    setCartBusy(cartItemId);
    await fetch(`/api/cart?id=${cartItemId}`, { method: "DELETE" });
    await fetchCart();
    setRates([]); setSelectedRate(null);
    setCartBusy(null);
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

    setPaying(true);
    try {
      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rateId: selectedRate.id,
          notes,
          email,
          discountCode: appliedDiscount?.code,
          address: {
            fullName, phone, addressLine1, addressLine2,
            city, state, stateCode,
            country: countryOptions.find(c => c.code === countryCode)?.name
              ?? COUNTRY_CODE_NAMES[countryCode]
              ?? countryCode,
            countryCode,
            postalCode,
          },
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
        <p className="text-[12px] tracking-[0.25em] uppercase text-[#8f8f8a]">Loading…</p>
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
          <p className="text-[13px] text-[#767672] mt-1">
            Delivery within Nigeria · Secure payment by Paystack
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-start">

          {/* ══ LEFT — form ══════════════════════════════════════ */}
          <div className="space-y-6 min-w-0">

            {error && (
              <div className="px-5 py-4 border border-[#111] bg-white text-[13.5px] text-[#111]">
                {error}
              </div>
            )}

            {/* 1 · Contact */}
            <Card n="1" title="Contact">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className={labelCls}>Phone *</label>
                  <input value={phone} onChange={e => onAddressChange(setPhone)(e.target.value)}
                    placeholder="+234 801 234 5678" className={inputCls} />
                </div>
              </div>
            </Card>

            {/* 2 · Delivery address */}
            <Card n="2" title="Delivery Address">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="md:col-span-2">
                  <label className={labelCls}>Postal Code (optional)</label>
                  <input value={postalCode} onChange={e => onAddressChange(setPostalCode)(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Get rates */}
              <button
                type="button"
                onClick={fetchRates}
                disabled={!addressComplete || ratesLoading}
                className="mt-5 w-full border border-[#111] bg-white text-[#111] text-[12px]
                  tracking-[0.2em] uppercase py-4 hover:bg-[#111] hover:text-white
                  transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#111]"
              >
                {ratesLoading ? "Fetching couriers…" : "Get Shipping Rates"}
              </button>
              {!addressComplete && (
                <p className="text-[12px] text-[#8f8f8a] mt-2">
                  Complete the required fields above to fetch delivery options.
                </p>
              )}
            </Card>

            {/* 3 · Delivery method */}
            <Card n="3" title="Delivery Method">
              {ratesLoading ? (
                <p className="text-[13.5px] text-[#767672] py-2">Contacting couriers…</p>
              ) : rates.length === 0 ? (
                <p className="text-[13.5px] text-[#767672] py-2">
                  {ratesError ?? "Enter your delivery address and fetch shipping rates to see courier options."}
                </p>
              ) : (
                <div className="space-y-3">
                  {rates.map(rate => {
                    const selected = selectedRate?.id === rate.id;
                    return (
                      <button key={rate.id} type="button" onClick={() => selectRate(rate)}
                        className={`w-full flex items-center justify-between gap-4 px-5 py-4 border text-left transition-colors ${
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
                            <span className="block text-[14px] text-[#111] truncate">{rate.carrier}</span>
                            {rate.deliveryTime && (
                              <span className="block text-[12px] text-[#767672] mt-0.5">{rate.deliveryTime}</span>
                            )}
                          </span>
                        </span>
                        <span className="text-[14px] text-[#111] flex-shrink-0">{fmt(rate.amount)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {ratesError && rates.length === 0 && !ratesLoading && (
                <p className="text-[12.5px] text-[#8f8f8a] mt-3">
                  Double-check the street, city, and state, then try again.
                </p>
              )}
            </Card>

            {/* 4 · Payment */}
            <Card n="4" title="Payment">
              <div className="flex items-center justify-between gap-4 px-5 py-4 border border-[#111] bg-[#fbfbfa]">
                <div>
                  <p className="text-[14px] text-[#111]">Paystack — Secure Checkout</p>
                  <p className="text-[12px] text-[#767672] mt-0.5">
                    Card · Bank Transfer · USSD · Opay
                  </p>
                </div>
                <span className="text-[11px] tracking-[0.18em] uppercase text-[#767672] flex-shrink-0">
                  ₦ NGN
                </span>
              </div>
              <p className="text-[12.5px] text-[#8f8f8a] mt-3">
                You&apos;ll be redirected to Paystack&apos;s secure page. We never see or store your card details.
              </p>
            </Card>

            {/* 5 · Notes */}
            <Card n="5" title="Order Notes (optional)">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Delivery instructions, gift note…" className={`${inputCls} resize-none`} />
            </Card>

            {/* Pay — desktop */}
            <div className="hidden lg:block pt-2">
              <PayButton paying={paying} ready={!!selectedRate} total={total} onClick={handlePay} />
            </div>
          </div>

          {/* ══ RIGHT — summary ══════════════════════════════════ */}
          <aside className="lg:sticky lg:top-[104px] self-start space-y-6">
            <div className="bg-white border border-[#e5e5e2] p-6">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#767672] mb-5">
                Your Order ({items.length})
              </p>

              <div className="space-y-5 max-h-[360px] overflow-y-auto pr-1">
                {items.map(item => {
                  const price = Number(item.variant.priceOverride ?? item.product.basePrice);
                  const busy = cartBusy === item.id;
                  return (
                    <div key={item.id} className="flex gap-4">
                      <Link href={`/products/${item.product.slug}`}
                        className="relative w-[68px] h-[90px] flex-shrink-0 bg-[#f5f5f4] overflow-hidden">
                        {item.product.images[0] && (
                          <Image src={item.product.images[0].url} alt={item.product.name}
                            fill className="object-cover object-top" sizes="68px" />
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] text-[#111] leading-snug truncate">{item.product.name}</p>
                        <p className="text-[12px] text-[#767672] mt-0.5">
                          {item.variant.colorLabel} · {item.variant.size}
                        </p>
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-center border border-[#d4d4d0]">
                            <button disabled={busy || item.quantity <= 1}
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="w-7 h-7 text-[14px] text-[#111] disabled:opacity-30">−</button>
                            <span className="w-7 text-center text-[12.5px]">{busy ? "…" : item.quantity}</span>
                            <button disabled={busy || item.quantity >= item.variant.stockQuantity}
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="w-7 h-7 text-[14px] text-[#111] disabled:opacity-30">+</button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] text-[#111]">{fmt(price * item.quantity)}</span>
                            <button disabled={busy} onClick={() => removeItem(item.id)}
                              className="text-[11px] text-[#8f8f8a] underline underline-offset-2 hover:text-[#111] disabled:opacity-30">
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Discount code */}
              <div className="border-t border-[#e5e5e2] mt-6 pt-5">
                {appliedDiscount ? (
                  <div className="flex items-center justify-between px-3 py-2.5 border border-[#111] bg-[#fbfbfa] text-[12.5px]">
                    <span className="text-[#111]">Code <b>{appliedDiscount.code}</b> applied</span>
                    <button type="button" onClick={removeDiscount}
                      className="text-[11px] text-[#8f8f8a] underline underline-offset-2 hover:text-[#111]">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={discountInput} onChange={e => setDiscountInput(e.target.value)}
                      placeholder="Discount code"
                      className="flex-1 border border-[#d4d4d0] bg-white px-3.5 py-2.5 text-[12.5px] text-[#111]
                        outline-none focus:border-[#111] transition-colors placeholder:text-[#b5b5b0]" />
                    <button type="button" onClick={applyDiscount}
                      disabled={applyingDiscount || !discountInput.trim()}
                      className="px-4 border border-[#111] text-[11px] tracking-[0.14em] uppercase
                        text-[#111] hover:bg-[#111] hover:text-white transition-colors disabled:opacity-40">
                      {applyingDiscount ? "…" : "Apply"}
                    </button>
                  </div>
                )}
                {discountError && <p className="text-[11.5px] text-red-700 mt-2">{discountError}</p>}
              </div>

              <div className="mt-5 pt-5 space-y-2.5">
                <Row label="Subtotal" value={fmt(subtotal)} />
                {appliedDiscount && (
                  <Row label="Discount" value={`− ${fmt(discountAmount)}`} />
                )}
                <Row label="Delivery"
                  value={selectedRate ? fmt(shippingFee) : "—"}
                  hint={!selectedRate ? "Select a courier" : undefined} />
                <div className="flex items-center justify-between pt-3 border-t border-[#e5e5e2] mt-3">
                  <span className="text-[12px] tracking-[0.18em] uppercase text-[#111]">Total</span>
                  <span className="text-[19px] text-[#111]">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Upsells */}
            {upsells.length > 0 && (
              <div className="bg-white border border-[#e5e5e2] p-6">
                <p className="text-[11px] tracking-[0.2em] uppercase text-[#767672] mb-4">
                  Complete the Look
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {upsells.map(p => {
                    const img = p.images?.find(i => i.isPrimary)?.url ?? p.images?.[0]?.url;
                    return (
                      <Link key={p.id} href={`/products/${p.slug}`} className="group block">
                        <div className="relative aspect-[3/4] bg-[#f5f5f4] overflow-hidden">
                          {img && <Image src={img} alt={p.name} fill
                            className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500" sizes="200px" />}
                        </div>
                        <p className="text-[12.5px] text-[#111] mt-2 truncate">{p.name}</p>
                        <p className="text-[12px] text-[#767672]">{fmt(Number(p.basePrice))}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pay — mobile */}
            <div className="lg:hidden">
              <PayButton paying={paying} ready={!!selectedRate} total={total} onClick={handlePay} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ── Small pieces ──────────────────────────────────────────────── */
function Card({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#e5e5e2] p-6 md:p-7">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-6 h-6 rounded-full bg-[#111] text-white text-[11px]
          flex items-center justify-center flex-shrink-0">{n}</span>
        <h2 className="text-[14px] tracking-[0.16em] uppercase text-[#111]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-[#767672]">{label}</span>
      <span className="text-[13.5px] text-[#111]">
        {value}{hint && <span className="text-[11px] text-[#b5b5b0] ml-2">{hint}</span>}
      </span>
    </div>
  );
}

function PayButton({ paying, ready, total, onClick }: {
  paying: boolean; ready: boolean; total: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={paying || !ready}
      className="w-full bg-[#111] text-white text-[12px] tracking-[0.25em] uppercase py-4
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
          <p className="text-[13.5px] text-[#767672] leading-relaxed mb-7">{body}</p>
          <button onClick={cta.onClick}
            className="bg-[#111] text-white text-[12px] tracking-[0.22em] uppercase px-8 py-4 hover:bg-black transition-colors">
            {cta.label}
          </button>
        </div>
      </div>
    </div>
  );
}
