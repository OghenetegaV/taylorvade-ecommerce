// src/components/ProductCard.tsx
// Manière-De-Voir-style card, Taylor Vade palette:
// - Flush image (no radius), hover swaps to 2nd image
// - Size run fades in over the image bottom on hover (desktop)
// - Info stack: "New In" script → script name + colour swatches + star →
//   serif type line → price
// Brown #8B5E3C only as the New In accent.

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/lib/currency";

type Variant = {
  id: string; size: string; colorLabel: string;
  colorHex?: string | null; stockQuantity: number; priceOverride?: number | null;
};

export interface ProductCardProps {
  id: string; slug: string; name: string; type: string;
  description?: string;
  basePrice: number; isNew: boolean; gender: string;
  images: { url: string }[];
  variants: Variant[];
}

const SIZE_ORDER = ["XXS","XS","S","M","L","XL","XXL","2XL","3XL"];

export default function ProductCard({
  id, slug, name, type, basePrice, isNew, images, variants,
}: ProductCardProps) {
  const [hover, setHover]     = useState(false);
  const [wished, setWished]   = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const router = useRouter();
  const { format } = useCurrency();
  const href = `/products/${slug}`;

  function goToProduct(e: React.MouseEvent) {
    // Let clicks on interactive children (the wishlist star) behave normally.
    if ((e.target as HTMLElement).closest("button")) return;
    router.push(href);
  }

  async function toggleWishlist() {
    if (wishBusy) return;
    const next = !wished;
    setWished(next);
    setWishBusy(true);
    try {
      const res = next
        ? await fetch("/api/wishlist", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: id }),
          })
        : await fetch(`/api/wishlist?productId=${id}`, { method: "DELETE" });
      if (res.status === 401) {
        setWished(!next);
        router.push(`/login?next=${encodeURIComponent(href)}`);
      }
    } catch {
      setWished(!next);
    } finally {
      setWishBusy(false);
    }
  }

  // Unique colours (keep first occurrence's hex)
  const swatches = useMemo(() => {
    const seen = new Map<string, string | null>();
    for (const v of variants) {
      if (!seen.has(v.colorLabel)) seen.set(v.colorLabel, v.colorHex ?? null);
    }
    return Array.from(seen.entries()).slice(0, 8); // [label, hex]
  }, [variants]);

  // Unique sizes in natural order; greyed if fully out of stock
  const sizes = useMemo(() => {
    const stock = new Map<string, number>();
    for (const v of variants) {
      stock.set(v.size, (stock.get(v.size) ?? 0) + v.stockQuantity);
    }
    return Array.from(stock.entries()).sort(
      (a, b) => SIZE_ORDER.indexOf(a[0]) - SIZE_ORDER.indexOf(b[0]),
    );
  }, [variants]);

  const img1 = images[0]?.url;
  const img2 = images[1]?.url;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={goToProduct}
      className="group cursor-pointer"
    >
      {/* ── Image — flush, no radius ── */}
      <Link href={href} className="block relative overflow-hidden bg-[#f5f5f4]"
        style={{ aspectRatio: "2/3" }}>
        {img1 && (
          <Image src={img1} alt={name} fill sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-cover object-top transition-opacity duration-500 ${
              hover && img2 ? "opacity-0" : "opacity-100"
            }`} />
        )}
        {img2 && (
          <Image src={img2} alt={`${name} — alternate view`} fill sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-cover object-top transition-opacity duration-500 ${
              hover ? "opacity-100" : "opacity-0"
            }`} />
        )}

        {/* Size run — desktop hover only */}
        {sizes.length > 0 && (
          <div className={`hidden md:flex absolute bottom-0 left-0 right-0 items-center gap-3
            px-4 py-3 transition-all duration-300 ${
            hover ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
            style={{ background: "linear-gradient(to top, rgba(255,255,255,0.92), rgba(255,255,255,0))" }}>
            {sizes.map(([size, qty]) => (
              <span key={size}
                className={`text-[11px] tracking-[0.08em] ${
                  qty > 0 ? "text-[#555]" : "text-[#c8c8c4] line-through"
                }`}>
                {size}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* ── Info stack ── */}
      <div className="px-3 md:px-4 pt-4 md:pt-5">
        {isNew && (
          <p className="text-[12px] text-[#8B5E3C] underline underline-offset-[3px] mb-1"
            style={{ fontFamily: "var(--font-script), cursive" }}>
            New In
          </p>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <Link href={`/products/${slug}`}
              className="text-[17px] leading-none text-[#111] hover:opacity-60 transition-opacity"
              style={{ fontFamily: "var(--font-script), cursive" }}>
              {name}
            </Link>
            {swatches.length > 1 && (
              <span className="flex items-center gap-[5px]">
                {swatches.map(([label, hex]) => (
                  <span key={label} title={label}
                    className="w-[11px] h-[11px] border border-[#d4d4d0] flex-shrink-0"
                    style={{ background: hex ?? "#e5e5e2" }} />
                ))}
              </span>
            )}
          </div>

          {/* Wishlist star */}
          <button
            onClick={toggleWishlist}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            className="flex-shrink-0 mt-[1px] hover:opacity-60 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24"
              fill={wished ? "#111" : "none"} stroke="#111" strokeWidth="1.3">
              <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.2 5.8 20.9l1.6-7L2 9.2l7.1-.6L12 2z"
                strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <Link href={`/products/${slug}`} className="block mt-1.5">
          <p className="text-[12.5px] text-[#111] leading-snug">{type}</p>
        </Link>

        <p className="text-[12.5px] text-[#111] mt-1.5">{format(Number(basePrice))}</p>
      </div>
    </div>
  );
}
