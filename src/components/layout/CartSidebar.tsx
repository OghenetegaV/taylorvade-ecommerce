"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string; name: string; slug: string; basePrice: number;
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

type Tab = "basket" | "wishlist";

type Props = {
  open: boolean;
  onClose: () => void;
  onCountChange?: (n: number) => void;
  initialTab?: Tab;
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", minimumFractionDigits: 0,
  }).format(n);
}

export default function CartSidebar({ open, onClose, onCountChange, initialTab = "basket" }: Props) {
  const [tab,     setTab]     = useState<Tab>(initialTab);
  const [items,   setItems]   = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy,    setBusy]    = useState<string | null>(null);

  const [wished,        setWished]        = useState<WishlistItem[]>([]);
  const [wishLoading,   setWishLoading]   = useState(false);
  const [wishSignedOut, setWishSignedOut] = useState(false);
  const [wishBusy,      setWishBusy]      = useState<string | null>(null);

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
      <div className={`fixed top-0 right-0 h-full w-[320px] max-w-[90vw] z-[100] flex flex-col
        bg-[#FAF9F7] transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}>

        {/* Header — Basket / Wishlist tabs */}
        <div className="flex items-center justify-between px-6 pt-6 border-b border-[#d5cec4]">
          <div className="flex items-center gap-6">
            <button onClick={() => setTab("basket")}
              className={`pb-4 text-[12.5px] tracking-[0.2em] uppercase font-serif border-b-2 -mb-px transition-colors ${
                tab === "basket" ? "text-[#3a2e22] border-[#3a2e22]" : "text-[#9a8a7a] border-transparent"
              }`}>
              Bag {items.length > 0 && `(${items.length})`}
            </button>
            <button onClick={() => setTab("wishlist")}
              className={`pb-4 text-[12.5px] tracking-[0.2em] uppercase font-serif border-b-2 -mb-px transition-colors ${
                tab === "wishlist" ? "text-[#3a2e22] border-[#3a2e22]" : "text-[#9a8a7a] border-transparent"
              }`}>
              Wishlist
            </button>
          </div>
          <button onClick={onClose} aria-label="Close" className="mb-4">
            <X size={15} strokeWidth={1.3} className="text-[#3a2e22]" />
          </button>
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
                        <Link href={`/products/${item.product.slug}`} onClick={onClose}>
                          <p className="text-[13px] tracking-[0.06em] text-[#3a2e22] font-serif
                            hover:opacity-60 transition-opacity truncate"
                            style={{ fontFamily: "var(--font-script), cursive" }}>
                            {item.product.name}
                          </p>
                        </Link>
                        <p className="text-[11.5px] tracking-[0.08em] text-[#9a8a7a] font-serif mt-0.5">
                          {item.variant.colorLabel} · {item.variant.size}
                        </p>
                        <p className="text-[12px] tracking-[0.06em] text-[#3a2e22] font-serif mt-1">
                          {fmt(price)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-[#d5cec4]">
                          <button
                            disabled={isBusy || item.quantity <= 1}
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#3a2e22]
                              text-[14.5px] hover:bg-[#f0eeeb] transition-colors disabled:opacity-30">
                            −
                          </button>
                          <span className="w-7 text-center text-[12px] font-serif text-[#3a2e22]">
                            {isBusy ? "…" : item.quantity}
                          </span>
                          <button
                            disabled={isBusy || item.quantity >= item.variant.stockQuantity}
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#3a2e22]
                              text-[14.5px] hover:bg-[#f0eeeb] transition-colors disabled:opacity-30">
                            +
                          </button>
                        </div>
                        <button
                          disabled={isBusy}
                          onClick={() => removeItem(item.id)}
                          className="text-[11.5px] tracking-wide text-[#9a8a7a] font-serif
                            underline underline-offset-2 hover:text-[#3a2e22] transition-colors
                            disabled:opacity-30">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-[#d5cec4]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11.5px] tracking-[0.12em] text-[#9a8a7a] font-serif uppercase">Subtotal</p>
              <p className="text-[13.5px] tracking-[0.06em] text-[#3a2e22] font-serif">{fmt(subtotal)}</p>
            </div>
            <p className="text-[11px] tracking-[0.08em] text-[#9a8a7a] font-serif mb-4">
              Shipping calculated at checkout
            </p>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full bg-[#4B3E3C] text-[#FAF9F7] text-center
                text-[12px] tracking-[0.2em] uppercase font-serif py-3.5
                hover:bg-[#1a1008] transition-colors">
              Checkout
            </Link>
            <button
              onClick={onClose}
              className="mt-3 w-full text-[11.5px] tracking-[0.12em] text-[#3a2e22] font-serif
                underline underline-offset-4 hover:opacity-50 transition-opacity">
              Continue Shopping
            </button>
          </div>
        )}
        </>
        )}
      </div>
    </>
  );
}