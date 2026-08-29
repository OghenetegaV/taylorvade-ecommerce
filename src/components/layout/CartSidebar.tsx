"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCurrency } from "@/lib/currency";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string; name: string; slug: string; type: string; basePrice: number;
    images: { url: string }[];
  };
  variant: {
    id: string; colorLabel: string; size: string; sku: string;
    stockQuantity: number; priceOverride: number | null;
  };
};

type WishlistItem = {
  id: string;
  product: { id: string; name: string; slug: string; basePrice: number; images: { url: string }[] };
};

type Upsell = {
  id: string; name: string; slug: string; basePrice: number;
  images?: { url: string; isPrimary?: boolean }[];
};

type Tab = "basket" | "wishlist";

const FREE_DELIVERY_THRESHOLD = 250000; // matches the Shipping Policy's free-delivery threshold
const ACCENT = "#641310"; // matches the reference site's --sale-red / free_shipping_false color exactly

type Props = {
  open: boolean;
  onClose: () => void;
  onCountChange?: (n: number) => void;
  initialTab?: Tab;
};

export default function CartSidebar({ open, onClose, onCountChange, initialTab = "basket" }: Props) {
  const { format: fmt } = useCurrency();
  const [tab,     setTab]     = useState<Tab>(initialTab);
  const [items,   setItems]   = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy,    setBusy]    = useState<string | null>(null);

  const [wished,        setWished]        = useState<WishlistItem[]>([]);
  const [wishLoading,   setWishLoading]   = useState(false);
  const [wishSignedOut, setWishSignedOut] = useState(false);
  const [wishBusy,      setWishBusy]      = useState<string | null>(null);

  const [upsells, setUpsells] = useState<Upsell[]>([]);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/cart");
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items);
        onCountChange?.(data.data.itemCount);
      }
    } catch (e) {
      console.error("Failed to fetch cart:", e);
    }
    setLoading(false);
  }, [onCountChange]);

  const fetchWishlist = useCallback(async () => {
    setWishLoading(true);
    try {
      const res  = await fetch("/api/wishlist");
      const data = await res.json();
      if (data.success) {
        setWished(data.data);
        setWishSignedOut(false);
      } else if (res.status === 401) {
        setWishSignedOut(true);
      }
    } catch (e) {
      console.error("Failed to fetch wishlist:", e);
    }
    setWishLoading(false);
  }, []);

  async function removeWishlistItem(productId: string) {
    setWishBusy(productId);
    await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
    await fetchWishlist();
    setWishBusy(null);
  }

  // Reset to the requested tab each time the drawer opens.
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  // Fetch on open, per active tab
  useEffect(() => {
    if (!open) return;
    if (tab === "basket") fetchCart();
    else fetchWishlist();
  }, [open, tab, fetchCart, fetchWishlist]);

  // 2. NEW: Listen for 'cartUpdated' event from other parts of the app
  useEffect(() => {
    window.addEventListener("cartUpdated", fetchCart);
    return () => window.removeEventListener("cartUpdated", fetchCart);
  }, [fetchCart]);

  // "Selected for You" — fetched once per drawer open, excluding items already in the bag.
  useEffect(() => {
    if (!open || tab !== "basket") return;
    const inCart = new Set(items.map(i => i.product.id));
    fetch("/api/products?limit=8&sortBy=createdAt&order=desc")
      .then(r => r.json())
      .then(d => {
        if (!d.success) return;
        setUpsells((d.data.products ?? d.data ?? []).filter((p: Upsell) => !inCart.has(p.id)).slice(0, 6));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, items.length]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function updateQty(cartItemId: string, quantity: number) {
    setBusy(cartItemId);
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId, quantity }),
    });
    await fetchCart();
    setBusy(null);
  }

  async function removeItem(cartItemId: string) {
    setBusy(cartItemId);
    await fetch(`/api/cart?id=${cartItemId}`, { method: "DELETE" });
    await fetchCart();
    setBusy(null);
  }

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.variant.priceOverride ?? item.product.basePrice);
    return sum + price * item.quantity;
  }, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[90] bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[calc(30vw+50px)] z-[100] flex flex-col
        bg-[#FAF9F7] transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}>

        {/* Close button — its own row, top right */}
        <div className="flex justify-end px-6 pt-5">
          <button onClick={onClose} aria-label="Close">
            <X size={22} strokeWidth={1.3} className="text-[#3a2e22]" />
          </button>
        </div>

        {/* Header — Basket / Wishlist tabs */}
        <div className="flex items-center px-6 border-b border-[#d5cec4]">
          <div className="flex flex-1 items-center">
            <button onClick={() => setTab("basket")}
              className={`flex-1 text-center pb-4 text-[16px] tracking-[0.06em] font-serif border-b-2 -mb-px transition-colors ${
                tab === "basket" ? "text-[#3a2e22]" : "text-[#9a8a7a] border-transparent"
              }`}
              style={tab === "basket" ? { borderColor: ACCENT } : undefined}>
              Basket {items.length > 0 && `(${items.length})`}
            </button>
            <button onClick={() => setTab("wishlist")}
              className={`flex-1 text-center pb-4 text-[13px] tracking-[0.06em] font-serif border-b-2 -mb-px transition-colors ${
                tab === "wishlist" ? "text-[#3a2e22]" : "text-[#9a8a7a] border-transparent"
              }`}
              style={tab === "wishlist" ? { borderColor: ACCENT } : undefined}>
              Wishlist
            </button>
          </div>
        </div>

        {tab === "wishlist" ? (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {wishLoading ? (
              <p className="text-[11.5px] tracking-[0.15em] text-[#9a8a7a] font-serif text-center pt-8">
                Loading…
              </p>
            ) : wishSignedOut ? (
              <div className="pt-12 text-center">
                <p className="text-[12.5px] tracking-[0.1em] text-[#3a2e22] font-serif mb-1">My Wishlist</p>
                <p className="text-[12px] tracking-[0.05em] text-[#9a8a7a] font-serif mb-5">
                  Log in or Register to view your Wishlist.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Link href="/login" onClick={onClose}
                    className="text-[11.5px] tracking-[0.12em] uppercase text-[#FAF9F7] bg-[#4B3E3C]
                      px-5 py-2.5 hover:bg-[#1a1008] transition-colors">
                    Log In
                  </Link>
                  <Link href="/register" onClick={onClose}
                    className="text-[11.5px] tracking-[0.12em] text-[#3a2e22] font-serif
                      underline underline-offset-4 hover:opacity-50 transition-opacity">
                    Register
                  </Link>
                </div>
              </div>
            ) : wished.length === 0 ? (
              <div className="pt-12 text-center">
                <p className="text-[12.5px] tracking-[0.1em] text-[#9a8a7a] font-serif mb-5">
                  Your wishlist is empty
                </p>
                <button onClick={onClose}
                  className="text-[11.5px] tracking-[0.12em] text-[#3a2e22] font-serif
                    underline underline-offset-4 hover:opacity-50 transition-opacity">
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {wished.map(w => (
                  <div key={w.id} className="flex gap-3">
                    <Link href={`/products/${w.product.slug}`} onClick={onClose}
                      className="relative w-[70px] h-[95px] flex-shrink-0 overflow-hidden bg-[#f0eeeb]">
                      {w.product.images[0] ? (
                        <Image src={w.product.images[0].url} alt={w.product.name} fill
                          className="object-cover object-top" sizes="70px" />
                      ) : (
                        <div className="w-full h-full bg-[#e8e2db]" />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link href={`/products/${w.product.slug}`} onClick={onClose}>
                          <p className="text-[13px] tracking-[0.06em] text-[#3a2e22] font-serif
                            hover:opacity-60 transition-opacity truncate"
                            style={{ fontFamily: "var(--font-script), cursive" }}>
                            {w.product.name}
                          </p>
                        </Link>
                        <p className="text-[12px] tracking-[0.06em] text-[#3a2e22] font-serif mt-1">
                          {fmt(Number(w.product.basePrice))}
                        </p>
                      </div>
                      <button
                        disabled={wishBusy === w.product.id}
                        onClick={() => removeWishlistItem(w.product.id)}
                        className="self-start text-[11.5px] tracking-wide text-[#9a8a7a] font-serif
                          underline underline-offset-2 hover:text-[#3a2e22] transition-colors
                          disabled:opacity-30">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-[11.5px] tracking-[0.15em] text-[#9a8a7a] font-serif text-center pt-8">
              Loading…
            </p>
          ) : items.length === 0 ? (
            <div className="pt-12 text-center">
              <p className="text-[12.5px] tracking-[0.1em] text-[#9a8a7a] font-serif mb-5">
                Your bag is empty
              </p>
              <button onClick={onClose}
                className="text-[11.5px] tracking-[0.12em] text-[#3a2e22] font-serif
                  underline underline-offset-4 hover:opacity-50 transition-opacity">
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map(item => {
                const price = Number(item.variant.priceOverride ?? item.product.basePrice);
                const isBusy = busy === item.id;
                return (
                  <div key={item.id} className="flex gap-3">
                    <Link href={`/products/${item.product.slug}`} onClick={onClose}
                      className="relative w-[70px] h-[95px] flex-shrink-0 overflow-hidden bg-[#f0eeeb]">
                      {item.product.images[0] ? (
                        <Image src={item.product.images[0].url} alt={item.product.name} fill
                          className="object-cover object-top" sizes="70px" />
                      ) : (
                        <div className="w-full h-full bg-[#e8e2db]" />
                      )}
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/products/${item.product.slug}`} onClick={onClose} className="min-w-0">
                            <p className="text-[13px] leading-snug tracking-[0.02em] text-[#3a2e22] font-serif
                              hover:opacity-60 transition-opacity">
                              <span className="font-semibold">{item.product.name}</span>
                              {item.product.type && <> — {item.product.type}</>} — {item.variant.colorLabel}
                            </p>
                          </Link>
                          <button
                            disabled={isBusy}
                            onClick={() => removeItem(item.id)}
                            className="flex-shrink-0 text-[11px] tracking-wide text-[#9a8a7a] font-serif
                              underline underline-offset-2 hover:text-[#3a2e22] transition-colors
                              disabled:opacity-30">
                            Remove
                          </button>
                        </div>
                        <p className="text-[11.5px] tracking-[0.08em] text-[#9a8a7a] font-serif mt-1">
                          {item.variant.size}
                        </p>
                      </div>

                      <div className="mt-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={isBusy || item.quantity <= 1}
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#3a2e22] border border-[#3a2e22]
                              text-[14.5px] hover:bg-[#f0eeeb] transition-colors disabled:opacity-30">
                            −
                          </button>
                          <span className="w-6 text-center text-[12px] font-serif text-[#3a2e22]">
                            {isBusy ? "…" : item.quantity}
                          </span>
                          <button
                            disabled={isBusy || item.quantity >= item.variant.stockQuantity}
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#3a2e22] border border-[#3a2e22]
                              text-[14.5px] hover:bg-[#f0eeeb] transition-colors disabled:opacity-30">
                            +
                          </button>
                        </div>
                        <p className="text-[12.5px] tracking-[0.06em] text-[#3a2e22] font-serif mt-2">
                          {fmt(price)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-6">
              <div className="h-[3px] bg-[#e8e2db] overflow-hidden">
                <div className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`,
                    background: ACCENT,
                  }} />
              </div>
              <p className="text-center text-[11.5px] tracking-[0.06em] font-serif mt-2.5" style={{ color: ACCENT }}>
                {subtotal >= FREE_DELIVERY_THRESHOLD
                  ? "You've unlocked free delivery!"
                  : `Add ${fmt(FREE_DELIVERY_THRESHOLD - subtotal)} for Free Delivery`}
              </p>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-6 py-5 border-t border-[#d5cec4]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11.5px] tracking-[0.12em] text-[#9a8a7a] font-serif uppercase">Subtotal</p>
                <p className="text-[14.5px] tracking-[0.06em] text-[#3a2e22] font-serif font-semibold">{fmt(subtotal)}</p>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full bg-[#4B3E3C] text-white text-center
                  text-[13px] tracking-[0.06em] font-serif py-2.5
                  hover:bg-[#1a1008] transition-colors">
                Checkout securely
              </Link>
            </div>
          )}

          {items.length > 0 && upsells.length > 0 && (
            <div className="pt-2 pb-2">
              <p className="text-center text-[18px] md:text-[24px] leading-none tracking-[1.47px] font-medium text-[#3a2e22] mt-2 mb-4"
                style={{ fontFamily: "var(--font-script), cursive" }}>
                Selected for You
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {upsells.map(p => {
                  const img = p.images?.find(i => i.isPrimary)?.url ?? p.images?.[0]?.url;
                  return (
                    <Link key={p.id} href={`/products/${p.slug}`} onClick={onClose}
                      className="group block flex-shrink-0 w-[110px]">
                      <div className="relative overflow-hidden bg-[#f0eeeb]" style={{ aspectRatio: "2/3" }}>
                        {img && <Image src={img} alt={p.name} fill
                          className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                          sizes="110px" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </>
  );
}