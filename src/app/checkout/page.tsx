"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { COUNTRY_CODE_NAMES } from "@/lib/shipping";
import { useCurrency } from "@/lib/currency";

type CartItem = {
  id: string;
  quantity: number;
  product: { id: string; name: string; slug: string; basePrice: number; images: { url: string }[] };
  variant: { id: string; colorLabel: string; size: string; stockQuantity: number; priceOverride: number | null };
};

type Rate = {
  id: string;
  carrier: string;
  logo: string | null;
  amount: number;
  deliveryTime: string;
  pickupTime: string;
};

type Upsell = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  images?: { url: string; isPrimary?: boolean }[];
  variants?: { id: string; size: string; colorLabel: string; stockQuantity: number }[];
};

const FREE_DELIVERY_THRESHOLD = 250000;

function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative w-full">
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className="peer w-full border border-[#d9d9d9] bg-white rounded-[6px] px-3.5 pt-5 pb-1.5 text-[14px] text-[#1a1a1a] font-sans outline-none focus:border-[#1a1a1a] transition-colors"
      />
      <label className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707070] text-[13px] font-sans transition-all duration-150 peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
        {label}
      </label>
      {icon && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#707070]">{icon}</div>}
    </div>
  );
}

function FloatingSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: { name: string; code: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="peer w-full appearance-none border border-[#d9d9d9] bg-white rounded-[6px] px-3.5 pt-5 pb-1.5 text-[14px] text-[#1a1a1a] font-sans outline-none focus:border-[#1a1a1a] transition-colors disabled:bg-[#f9f9f9]"
      >
        <option value="" disabled hidden></option>
        {options.map((o) => (
          <option key={o.code || o.name} value={o.code || o.name}>
            {o.name}
          </option>
        ))}
      </select>
      <label className="pointer-events-none absolute left-3.5 top-2.5 text-[10px] text-[#707070] font-sans">
        {label}
      </label>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#707070] text-[10px]">
        ▼
      </span>
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="More info"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full border border-[#707070] text-[10px] flex items-center justify-center font-bold text-[#707070] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
      >
        ?
      </button>
      {open && (
        <span className="absolute z-20 right-0 top-6 w-52 p-2.5 text-[11.5px] leading-snug text-white bg-[#1a1a1a] rounded-[6px] shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

function CheckboxField({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none text-[13px] text-[#333333]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-[#d9d9d9] accent-black cursor-pointer"
      />
      <span>{label}</span>
    </label>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { format: fmt } = useCurrency();

  const [authState, setAuthState] = useState<"loading" | "guest" | "authed">("loading");
  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [smsNewsletter, setSmsNewsletter] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);

  const [items, setItems] = useState<CartItem[]>([]);
  const [cartBusy, setCartBusy] = useState<string | null>(null);
  const [upsellBusy, setUpsellBusy] = useState<string | null>(null);
  const upsellScrollRef = useRef<HTMLDivElement>(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [countryCode, setCountryCode] = useState("NG");
  const [countryOptions, setCountryOptions] = useState<{ name: string; code: string }[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [stateOptions, setStateOptions] = useState<{ name: string; code: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ name: string; code: string }[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingFullName, setBillingFullName] = useState("");
  const [billingAddressLine1, setBillingAddressLine1] = useState("");
  const [billingAddressLine2, setBillingAddressLine2] = useState("");
  const [billingCountryCode, setBillingCountryCode] = useState("NG");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingStateCode, setBillingStateCode] = useState("");
  const [billingStateOptions, setBillingStateOptions] = useState<{ name: string; code: string }[]>([]);
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [billingLocLoading, setBillingLocLoading] = useState(false);

  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const [discountInput, setDiscountInput] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);

  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upsells, setUpsells] = useState<Upsell[]>([]);

  useEffect(() => {
    const combined = `${firstName} ${lastName}`.trim();
    if (combined) setFullName(combined);
  }, [firstName, lastName]);

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
        const metaName = session.user.user_metadata?.full_name ?? "";
        setFullName(metaName);
        if (metaName) {
          const parts = metaName.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
      } else {
        setAuthState("guest");
      }
    });
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shipping/locations?type=countries")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setCountryOptions(d.data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStateOptions([]);
    setStateCode("");
    setState("");
    setCityOptions([]);
    setCity("");
    if (!countryCode) return;
    setLocLoading(true);
    fetch(`/api/shipping/locations?type=states&country=${encodeURIComponent(countryCode)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setStateOptions(d.data);
      })
      .finally(() => {
        if (!cancelled) setLocLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  useEffect(() => {
    let cancelled = false;
    setCityOptions([]);
    setCity("");
    if (!stateCode || !countryCode) return;
    setLocLoading(true);
    fetch(
      `/api/shipping/locations?type=cities&country=${encodeURIComponent(countryCode)}&state_code=${encodeURIComponent(stateCode)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setCityOptions(d.data);
      })
      .finally(() => {
        if (!cancelled) setLocLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stateCode, countryCode]);

  useEffect(() => {
    let cancelled = false;
    if (billingSameAsShipping || !billingCountryCode) {
      setBillingStateOptions([]);
      return;
    }
    setBillingLocLoading(true);
    fetch(`/api/shipping/locations?type=states&country=${encodeURIComponent(billingCountryCode)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setBillingStateOptions(d.data);
      })
      .finally(() => {
        if (!cancelled) setBillingLocLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [billingCountryCode, billingSameAsShipping]);

  useEffect(() => {
    if (!cartLoaded) return;
    const inCart = new Set(items.map((i) => i.product.id));
    fetch("/api/products?limit=8&sortBy=createdAt&order=desc")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setUpsells((d.data.products ?? d.data ?? []).filter((p: Upsell) => !inCart.has(p.id)).slice(0, 6));
      })
      .catch(() => {});
  }, [cartLoaded, items.length]);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.variant.priceOverride ?? i.product.basePrice) * i.quantity, 0),
    [items]
  );
  const shippingFee = selectedRate?.amount ?? 0;
  const discountAmount = appliedDiscount?.amount ?? 0;
  const total = Math.max(0, subtotal - discountAmount) + shippingFee;

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const addressComplete =
    emailValid &&
    (fullName.trim() || (firstName.trim() && lastName.trim())) &&
    phone.trim() &&
    addressLine1.trim() &&
    city.trim() &&
    state.trim();

  const billingComplete =
    billingSameAsShipping ||
    (billingFullName.trim() && billingAddressLine1.trim() && billingCity.trim() && billingState.trim());

  useEffect(() => {
    if (!cartLoaded || items.length === 0) return;
    sendGAEvent("event", "begin_checkout", {
      currency: "NGN",
      value: subtotal,
      items: items.map((i) => ({
        item_id: i.product.id,
        item_name: i.product.name,
        item_variant: `${i.variant.colorLabel} / ${i.variant.size}`,
        price: Number(i.variant.priceOverride ?? i.product.basePrice),
        quantity: i.quantity,
      })),
    });
  }, [cartLoaded]);

  function resetRates() {
    if (rates.length > 0 || selectedRate) {
      setRates([]);
      setSelectedRate(null);
    }
  }

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
            name: fullName || `${firstName} ${lastName}`.trim(),
            phone,
            line1: addressLine1,
            line2: addressLine2,
            city,
            state,
            stateCode,
            country: countryCode,
            postalCode,
          },
        }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error ?? "Could not fetch rates");
      setRates(d.data.rates);
      if (d.data.rates[0]) selectRate(d.data.rates[0]);
    } catch (e) {
      setRatesError(
        e instanceof Error ? e.message : "Could not fetch shipping rates. Please check the address and try again."
      );
    } finally {
      setRatesLoading(false);
    }
  }

  function selectRate(rate: Rate) {
    setSelectedRate(rate);
    sendGAEvent("event", "add_shipping_info", {
      currency: "NGN",
      value: subtotal,
      shipping_tier: rate.carrier,
    });
  }

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

  async function updateQty(cartItemId: string, quantity: number) {
    setCartBusy(cartItemId);
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId, quantity }),
    });
    await fetchCart();
    setRates([]);
    setSelectedRate(null);
    setCartBusy(null);
  }

  async function removeItem(cartItemId: string) {
    setCartBusy(cartItemId);
    await fetch(`/api/cart?id=${cartItemId}`, { method: "DELETE" });
    await fetchCart();
    setRates([]);
    setSelectedRate(null);
    setCartBusy(null);
  }

  function singleVariant(p: Upsell) {
    const inStock = (p.variants ?? []).filter((v) => v.stockQuantity > 0);
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
      setRates([]);
      setSelectedRate(null);
      window.dispatchEvent(new Event("cartUpdated"));
    } finally {
      setUpsellBusy(null);
    }
  }

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

    if ((newsletter || smsNewsletter) && emailValid) {
      fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, categories: ["All"], smsOptIn: smsNewsletter }),
      }).catch(() => {});
    }

    setPaying(true);
    try {
      const shippingAddress = {
        fullName: fullName || `${firstName} ${lastName}`.trim(),
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        stateCode,
        country:
          countryOptions.find((c) => c.code === countryCode)?.name ??
          COUNTRY_CODE_NAMES[countryCode] ??
          countryCode,
        countryCode,
        postalCode,
      };
      const billingAddress = billingSameAsShipping
        ? shippingAddress
        : {
            fullName: billingFullName,
            phone,
            addressLine1: billingAddressLine1,
            addressLine2: billingAddressLine2,
            city: billingCity,
            state: billingState,
            stateCode: billingStateCode,
            country:
              countryOptions.find((c) => c.code === billingCountryCode)?.name ??
              COUNTRY_CODE_NAMES[billingCountryCode] ??
              billingCountryCode,
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
      window.location.href = data.data.paymentUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPaying(false);
    }
  }

  const renderOrderSummaryContent = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {items.map((item) => {
          const price = Number(item.variant.priceOverride ?? item.product.basePrice);
          const busy = cartBusy === item.id;
          return (
            <div key={item.id} className="flex items-center gap-4">
              <div className="relative w-[60px] h-[68px] rounded-[6px] bg-[#e5e5e0] border border-[#e0e0e0] flex-shrink-0">
                {item.product.images[0] && (
                  <Image
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    fill
                    className="object-cover rounded-[6px]"
                    sizes="60px"
                  />
                )}
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#000000] text-white text-[11px] font-semibold flex items-center justify-center border-2 border-white">
                  {item.quantity}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#1a1a1a] leading-tight truncate">
                  {item.product.name}
                </p>
                <p className="text-[11.5px] text-[#707070] mt-0.5">
                  {item.variant.size} / {item.variant.colorLabel}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center border border-[#d9d9d9] bg-white rounded-[4px]">
                    <button
                      type="button"
                      disabled={busy || item.quantity <= 1}
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-5 h-5 flex items-center justify-center text-[12px] disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="text-[11px] font-medium px-1.5">{item.quantity}</span>
                    <button
                      type="button"
                      disabled={busy || item.quantity >= item.variant.stockQuantity}
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-5 h-5 flex items-center justify-center text-[12px] disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeItem(item.id)}
                    className="text-[11px] text-[#707070] underline hover:text-black"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="text-[13.5px] font-medium text-[#1a1a1a] flex-shrink-0">
                {fmt(price * item.quantity)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Discount code or gift card"
          value={discountInput}
          onChange={(e) => setDiscountInput(e.target.value)}
          className="flex-1 border border-[#d9d9d9] bg-white rounded-[6px] px-3.5 py-2.5 text-[13px] text-[#1a1a1a] outline-none focus:border-[#1a1a1a] placeholder:text-[#999999]"
        />
        <button
          type="button"
          onClick={applyDiscount}
          disabled={applyingDiscount || !discountInput.trim()}
          className="bg-[#e5e5e5] text-[#707070] text-[13px] font-semibold px-5 rounded-[6px] hover:bg-[#d9d9d9] hover:text-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {applyingDiscount ? "…" : "Apply"}
        </button>
      </div>

      {appliedDiscount && (
        <div className="flex items-center justify-between px-3 py-2 border border-[#1a1a1a] rounded-[6px] bg-white text-[13px]">
          <span>Code <strong>{appliedDiscount.code}</strong> applied</span>
          <button type="button" onClick={removeDiscount} className="text-[#707070] underline text-[12px]">
            Remove
          </button>
        </div>
      )}
      {discountError && <p className="text-[12px] text-red-700">{discountError}</p>}

      <div className="space-y-2.5 pt-2 border-t border-[#e5e5e0]">
        <div className="flex items-center justify-between text-[13.5px]">
          <span className="text-[#333333]">Subtotal</span>
          <span className="font-medium text-[#1a1a1a]">{fmt(subtotal)}</span>
        </div>
        {appliedDiscount && (
          <div className="flex items-center justify-between text-[13.5px]">
            <span className="text-[#333333]">Discount</span>
            <span className="font-medium text-[#1a1a1a]">- {fmt(discountAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[13.5px]">
          <span className="flex items-center gap-1.5 text-[#333333]">
            Shipping
            <InfoTooltip text="Calculated once you enter your delivery address and choose a courier above." />
          </span>
          <span className="text-[#707070]">
            {selectedRate ? fmt(shippingFee) : "Enter shipping address"}
          </span>
        </div>
        <div className="flex items-baseline justify-between pt-3 border-t border-[#e5e5e0]">
          <span className="text-[15px] font-semibold text-[#1a1a1a]">Total</span>
          <span className="text-[18px] font-bold text-[#1a1a1a]">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );

  if (authState === "loading" || !cartLoaded) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <div className="h-[66px] md:h-[86px]" />
        <div className="flex items-center justify-center pb-12">
          <p className="text-[14px] text-[#707070]">Loading checkout…</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <div className="h-[66px] md:h-[86px]" />
        <div className="flex items-center justify-center px-6 pb-16">
          <div className="text-center max-w-sm">
            <p className="text-[20px] font-semibold text-[#1a1a1a] mb-2 font-serif">Your bag is empty</p>
            <p className="text-[14px] text-[#707070] leading-relaxed mb-6">
              Add something you love to your cart, then return to complete checkout.
            </p>
            <button
              onClick={() => router.push("/collections/woman")}
              className="w-full bg-[#1a1a1a] text-white text-[13px] uppercase tracking-widest font-semibold rounded-[4px] py-3.5 hover:bg-black transition-colors"
            >
              Shop the Collection
            </button>
          </div>
        </div>
      </div>
    );
  }

  const topUpsell = upsells[0];

  return (
    <div className="relative min-h-screen bg-white font-sans">
      {/* Order-summary backdrop — spans the full page height (behind the
          transparent-on-desktop header too) so it's visible immediately,
          not just once the header's clearance has scrolled past. */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-[44%] bg-[#f5f5f5] border-l border-[#e5e5e0]" />

      <div className="h-[66px] md:h-[86px]" />

      <div className="lg:hidden sticky top-[66px] md:top-[86px] z-40 border-b border-[#e5e5e0] bg-[#f5f5f5]">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => setSummaryOpen(!summaryOpen)}
            className="flex items-center gap-2 text-[14px] font-medium text-[#1a1a1a]"
          >
            <span>Order Summary</span>
            <svg
              className={`w-4 h-4 text-[#1a1a1a] transition-transform duration-200 ${
                summaryOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <span className="text-[15px] font-bold text-[#1a1a1a]">{fmt(total)}</span>
        </div>
        {summaryOpen && (
          <div className="px-6 pb-6 border-t border-[#e5e5e0] pt-4 bg-[#f5f5f5] max-h-[calc(100vh-140px)] overflow-y-auto">
            {renderOrderSummaryContent()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[56%_44%] min-h-[calc(100vh-66px)] md:min-h-[calc(100vh-86px)]">
        <div className="px-6 md:px-16 lg:px-20 py-8 flex flex-col items-center">
          <div className="w-full max-w-[540px] space-y-8">
            <div>
              <p className="text-center text-[12px] text-[#707070] uppercase tracking-wider mb-3 font-medium">Express Checkout</p>
              <button
                type="button"
                onClick={handlePay}
                className="w-full bg-[#000000] text-white rounded-[4px] py-3.5 flex items-center justify-center gap-2 hover:bg-[#222222] transition-colors"
              >
                <span className="text-[15px] font-semibold tracking-tight">G Pay</span>
              </button>
              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-[#e5e5e0]"></div>
                <span className="flex-shrink mx-4 text-[#707070] text-[11px] font-semibold uppercase tracking-widest">OR</span>
                <div className="flex-grow border-t border-[#e5e5e0]"></div>
              </div>
            </div>

            {topUpsell && (
              <div className="space-y-3">
                <h3 className="text-[14px] font-bold text-[#1a1a1a]">Selected for You</h3>
                <div className="flex items-center justify-between p-3 border border-[#e5e5e0] rounded-[8px] bg-[#fafafa]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-[54px] h-[64px] rounded-[6px] bg-[#e5e5e0] flex-shrink-0 overflow-hidden">
                      {(topUpsell.images?.find((i) => i.isPrimary)?.url ?? topUpsell.images?.[0]?.url) && (
                        <Image
                          src={topUpsell.images?.find((i) => i.isPrimary)?.url ?? topUpsell.images?.[0]?.url ?? ""}
                          alt={topUpsell.name}
                          fill
                          className="object-cover"
                          sizes="54px"
                        />
                      )}
                      <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black text-white text-[10px] font-semibold flex items-center justify-center">
                        1
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-[#1a1a1a] truncate leading-tight">{topUpsell.name}</p>
                      <p className="text-[11.5px] text-[#707070] truncate mt-0.5">
                        {singleVariant(topUpsell)
                          ? `${singleVariant(topUpsell)?.size} / ${singleVariant(topUpsell)?.colorLabel}`
                          : "Multiple Sizes"}
                      </p>
                      <p className="text-[12px] font-bold text-[#1a1a1a] mt-0.5">{fmt(Number(topUpsell.basePrice))}</p>
                    </div>
                  </div>
                  {singleVariant(topUpsell) ? (
                    <button
                      type="button"
                      onClick={() => addUpsell(topUpsell)}
                      disabled={upsellBusy === topUpsell.id}
                      className="bg-[#000000] text-white text-[12px] font-semibold px-5 py-2 rounded-[8px] hover:bg-black transition-colors flex-shrink-0 disabled:opacity-50"
                    >
                      {upsellBusy === topUpsell.id ? "Adding…" : "Add"}
                    </button>
                  ) : (
                    <Link
                      href={`/products/${topUpsell.slug}`}
                      className="bg-[#000000] text-white text-[12px] font-semibold px-5 py-2 rounded-[8px] hover:bg-black transition-colors flex-shrink-0 text-center"
                    >
                      Select
                    </Link>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 border border-red-800 rounded-[4px] bg-red-50 text-[13px] text-red-800">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-[#1a1a1a]">Contact</h2>
                {authState === "guest" && (
                  <Link href="/login?next=/checkout" className="text-[13px] text-[#1a1a1a] underline underline-offset-2 hover:opacity-70">
                    Sign in
                  </Link>
                )}
              </div>
              <FloatingInput
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                required
                icon={<InfoTooltip text="We'll send your order confirmation and delivery updates to this email." />}
              />
              <CheckboxField
                checked={newsletter}
                onChange={setNewsletter}
                label="Sign up to our email newsletter"
              />
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-[18px] font-semibold text-[#1a1a1a]">Delivery</h2>
              <FloatingSelect
                label="Country/Region"
                value={countryCode}
                options={countryOptions}
                onChange={(v) => {
                  setCountryCode(v);
                  resetRates();
                }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FloatingInput
                  label="First name (optional)"
                  value={firstName}
                  onChange={(v) => {
                    setFirstName(v);
                    resetRates();
                  }}
                />
                <FloatingInput
                  label="Last name"
                  value={lastName}
                  onChange={(v) => {
                    setLastName(v);
                    resetRates();
                  }}
                  required
                />
              </div>
              <FloatingInput
                label="Address"
                value={addressLine1}
                onChange={(v) => {
                  setAddressLine1(v);
                  resetRates();
                }}
                required
                icon={
                  <svg className="w-4 h-4 text-[#707070]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              <FloatingInput
                label="Apartment, suite, etc. (optional)"
                value={addressLine2}
                onChange={(v) => {
                  setAddressLine2(v);
                  resetRates();
                }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stateOptions.length > 0 ? (
                  <FloatingSelect
                    label="State"
                    value={stateCode}
                    options={stateOptions}
                    onChange={(v) => {
                      const code = v;
                      const name = stateOptions.find((s) => s.code === code)?.name || "";
                      setStateCode(code);
                      setState(name);
                      resetRates();
                    }}
                  />
                ) : (
                  <FloatingInput
                    label="State"
                    value={state}
                    onChange={(v) => {
                      setState(v);
                      resetRates();
                    }}
                    required
                  />
                )}
                {cityOptions.length > 0 ? (
                  <FloatingSelect
                    label="City"
                    value={city}
                    options={cityOptions.map((c) => ({ name: c.name, code: c.name }))}
                    onChange={(v) => {
                      setCity(v);
                      resetRates();
                    }}
                  />
                ) : (
                  <FloatingInput
                    label="City"
                    value={city}
                    onChange={(v) => {
                      setCity(v);
                      resetRates();
                    }}
                    required
                  />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FloatingInput
                  label="Postcode (optional)"
                  value={postalCode}
                  onChange={(v) => {
                    setPostalCode(v);
                    resetRates();
                  }}
                />
                <FloatingInput
                  label="Phone"
                  value={phone}
                  onChange={(v) => {
                    setPhone(v);
                    resetRates();
                  }}
                  required
                  icon={<InfoTooltip text="Your courier will contact you on this number to coordinate delivery." />}
                />
              </div>

              <div className="space-y-2 pt-2">
                <CheckboxField
                  checked={saveInfo}
                  onChange={setSaveInfo}
                  label="Save this information for next time"
                />
                <CheckboxField
                  checked={smsNewsletter}
                  onChange={setSmsNewsletter}
                  label="Sign up to our SMS newsletter"
                />
              </div>

              <button
                type="button"
                onClick={fetchRates}
                disabled={!addressComplete || ratesLoading}
                className="w-full mt-3 border border-[#1a1a1a] rounded-[6px] bg-white text-[#1a1a1a] text-[13px] font-semibold uppercase tracking-wider py-3 hover:bg-[#1a1a1a] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {ratesLoading ? "Fetching couriers…" : "Get Shipping Rates"}
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-[18px] font-semibold text-[#1a1a1a]">Shipping Method</h2>
              {ratesLoading ? (
                <div className="p-4 border border-[#e5e5e0] rounded-[6px] bg-[#fafafa] text-[13px] text-[#707070]">
                  Contacting shipping carriers…
                </div>
              ) : rates.length === 0 ? (
                <div className="p-4 border border-[#e5e5e0] rounded-[6px] bg-[#fafafa] text-[13px] text-[#707070] text-center">
                  {ratesError ?? "Enter your shipping address to view available shipping methods."}
                </div>
              ) : (
                <div className="space-y-2">
                  {rates.map((rate) => {
                    const selected = selectedRate?.id === rate.id;
                    return (
                      <button
                        key={rate.id}
                        type="button"
                        onClick={() => selectRate(rate)}
                        className={`w-full flex items-center justify-between gap-4 px-4 py-3.5 border rounded-[6px] text-left transition-colors ${
                          selected ? "border-[#1a1a1a] bg-[#fdfdfd]" : "border-[#d9d9d9] bg-white hover:border-[#8f8f8a]"
                        }`}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-4 h-4 rounded-full border flex-shrink-0 ${
                              selected ? "border-[#1a1a1a] bg-[#1a1a1a] shadow-[inset_0_0_0_3px_#fff]" : "border-[#b5b5b0]"
                            }`}
                          />
                          <span className="min-w-0">
                            <span className="block text-[14px] font-medium text-[#1a1a1a] truncate">{rate.carrier}</span>
                            {rate.deliveryTime && (
                              <span className="block text-[12px] text-[#707070]">{rate.deliveryTime}</span>
                            )}
                          </span>
                        </span>
                        <span className="text-[14px] font-medium text-[#1a1a1a] flex-shrink-0">{fmt(rate.amount)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {upsells.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[#e5e5e0]">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-[3px] bg-[#ececec] overflow-hidden rounded-full">
                      <div
                        className="h-full bg-[#1a1a1a] transition-all duration-500"
                        style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[12.5px] text-[#1a1a1a] font-sans mt-2">
                      {subtotal >= FREE_DELIVERY_THRESHOLD
                        ? "You've unlocked free delivery!"
                        : `Free shipping is ${fmt(FREE_DELIVERY_THRESHOLD - subtotal)} away!`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      aria-label="Scroll left"
                      onClick={() => upsellScrollRef.current?.scrollBy({ left: -180, behavior: "smooth" })}
                      className="w-8 h-8 flex items-center justify-center border border-[#d9d9d9] rounded-[4px] hover:border-[#1a1a1a] transition-colors text-[13px]"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      aria-label="Scroll right"
                      onClick={() => upsellScrollRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
                      className="w-8 h-8 flex items-center justify-center border border-[#d9d9d9] rounded-[4px] hover:border-[#1a1a1a] transition-colors text-[13px]"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div
                  ref={upsellScrollRef}
                  className="flex gap-4 overflow-x-auto pb-2 pt-1 no-scrollbar"
                  style={{ scrollbarWidth: "none" }}
                >
                  {upsells.map((p) => {
                    const img = p.images?.find((i) => i.isPrimary)?.url ?? p.images?.[0]?.url;
                    const variant = singleVariant(p);
                    const busy = upsellBusy === p.id;
                    return (
                      <div key={p.id} className="flex-shrink-0 w-[150px] space-y-2">
                        <Link href={`/products/${p.slug}`} className="group block">
                          <div className="relative aspect-[3/4] rounded-[6px] bg-[#f5f5f4] overflow-hidden">
                            {img && (
                              <Image
                                src={img}
                                alt={p.name}
                                fill
                                className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                                sizes="150px"
                              />
                            )}
                          </div>
                          <p className="text-[13px] font-medium text-[#1a1a1a] mt-2 truncate leading-tight">{p.name}</p>
                          <p className="text-[12px] text-[#707070] mt-0.5">{fmt(Number(p.basePrice))}</p>
                        </Link>
                        {variant ? (
                          <button
                            type="button"
                            onClick={() => addUpsell(p)}
                            disabled={busy}
                            className="w-full bg-[#1a1a1a] text-white text-[12px] font-semibold rounded-[20px] py-2 hover:bg-black transition-colors disabled:opacity-50"
                          >
                            {busy ? "Adding…" : "Add"}
                          </button>
                        ) : (
                          <Link
                            href={`/products/${p.slug}`}
                            className="block w-full text-center bg-[#1a1a1a] text-white text-[12px] font-semibold rounded-[20px] py-2 hover:bg-black transition-colors"
                          >
                            Select
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <h2 className="text-[18px] font-semibold text-[#1a1a1a]">Payment</h2>
              <p className="text-[13px] text-[#707070]">All transactions are secure and encrypted.</p>
              <div className="border border-[#1a1a1a] rounded-[6px] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3.5 bg-[#f5f5f5]">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full border border-[#1a1a1a] bg-[#1a1a1a] shadow-[inset_0_0_0_3px_#fff] flex-shrink-0" />
                    <span className="text-[14px] font-medium text-[#1a1a1a]">Paystack — Secure Checkout</span>
                  </div>
                </div>
                <div className="px-4 py-3 text-[13px] text-[#707070] border-t border-[#e5e5e0] bg-white">
                  You will be redirected to Paystack&apos;s secure platform to complete payment with Card, Bank Transfer, or USSD.
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-[18px] font-semibold text-[#1a1a1a]">Billing Address</h2>
              <div className="border border-[#d9d9d9] rounded-[6px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setBillingSameAsShipping(true)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-[#e5e5e0] ${
                    billingSameAsShipping ? "bg-[#f5f5f5]" : "bg-white"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border flex-shrink-0 ${
                      billingSameAsShipping ? "border-[#1a1a1a] bg-[#1a1a1a] shadow-[inset_0_0_0_3px_#fff]" : "border-[#b5b5b0]"
                    }`}
                  />
                  <span className="text-[14px] font-medium text-[#1a1a1a]">Same as shipping address</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingSameAsShipping(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    !billingSameAsShipping ? "bg-[#f5f5f5]" : "bg-white"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border flex-shrink-0 ${
                      !billingSameAsShipping ? "border-[#1a1a1a] bg-[#1a1a1a] shadow-[inset_0_0_0_3px_#fff]" : "border-[#b5b5b0]"
                    }`}
                  />
                  <span className="text-[14px] font-medium text-[#1a1a1a]">Use a different billing address</span>
                </button>
              </div>

              {!billingSameAsShipping && (
                <div className="space-y-3 pt-2">
                  <FloatingSelect
                    label="Country/Region"
                    value={billingCountryCode}
                    options={countryOptions}
                    onChange={setBillingCountryCode}
                  />
                  <FloatingInput
                    label="Full Name"
                    value={billingFullName}
                    onChange={setBillingFullName}
                    required
                  />
                  <FloatingInput
                    label="Address"
                    value={billingAddressLine1}
                    onChange={setBillingAddressLine1}
                    required
                  />
                  <FloatingInput
                    label="Apartment, suite, etc. (optional)"
                    value={billingAddressLine2}
                    onChange={setBillingAddressLine2}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {billingStateOptions.length > 0 ? (
                      <FloatingSelect
                        label="State"
                        value={billingStateCode}
                        options={billingStateOptions}
                        onChange={(v) => {
                          const code = v;
                          const name = billingStateOptions.find((s) => s.code === code)?.name || "";
                          setBillingStateCode(code);
                          setBillingState(name);
                        }}
                      />
                    ) : (
                      <FloatingInput
                        label="State"
                        value={billingState}
                        onChange={setBillingState}
                        required
                      />
                    )}
                    <FloatingInput
                      label="City"
                      value={billingCity}
                      onChange={setBillingCity}
                      required
                    />
                  </div>
                  <FloatingInput
                    label="Postcode (optional)"
                    value={billingPostalCode}
                    onChange={setBillingPostalCode}
                  />
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handlePay}
                disabled={paying || !selectedRate}
                className="w-full bg-[#000000] text-white text-[15px] font-semibold rounded-[20px] py-3.5 hover:bg-[#222222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paying ? "Redirecting…" : "Pay Now"}
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:block relative px-6 md:px-12 lg:px-16 py-10">
          <div className="sticky top-[86px] max-w-[440px]">
            {renderOrderSummaryContent()}
          </div>
        </div>
      </div>

      <div className="border-t border-[#e5e5e0] px-6 py-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[#1a1a1a]">
        <Link href="/returns" className="underline underline-offset-2 hover:opacity-70">
          Refund Policy
        </Link>
        <Link href="/shipping-policy" className="underline underline-offset-2 hover:opacity-70">
          Shipping
        </Link>
        <Link href="/terms" className="underline underline-offset-2 hover:opacity-70">
          Terms of service
        </Link>
      </div>
    </div>
  );
}