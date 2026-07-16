// src/components/ProductCard.tsx
// Matches Manière De Voir card design exactly:
//
// [IMAGE 2:3]
//   └─ hover: sizes slide up from bottom
//   └─ hover: secondary image crossfades in
//
// [New In] [Unisex]                    [☆]
// [Jessica (script)]    [■ ■ ■ swatches]
// [Contour Lace Halter Drape Neck...]
// [£90]

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ── Star icon ────────────────────────────────────────────────────────────────
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="0.85"
    className="w-[16px] h-[16px] flex-shrink-0"
  >
    <path
      strokeLinecap="round" strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </svg>
);

// ── Types ────────────────────────────────────────────────────────────────────
export interface ProductVariant {
  id:            string;
  size:          string;
  colorLabel:    string;
  colorHex?:     string | null;
  stockQuantity: number;
  priceOverride?: number | null;
}

export interface ProductCardProps {
  id:          string;
  slug:        string;
  name:        string;
  type:        string;
  description?: string;
  basePrice:   number;
  currency?:   string;
  isNew?:      boolean;
  gender?:     string;   // "MEN" | "WOMEN" | "UNISEX"
  images:      { url: string }[];
  variants:    ProductVariant[];
}

// ── Size display order ───────────────────────────────────────────────────────
const SIZE_ORDER = ["XXS","XS","S","M","L","XL","XXL","XXXL","One Size"];

export default function ProductCard({
  slug, name, type, description, basePrice, currency = "₦",
  isNew, gender, images = [], variants = [],
}: ProductCardProps) {
  const [wished,   setWished]   = useState(false);
  const [imgError, setImgError] = useState(false);

  const primaryImg = images[0]?.url ?? "";
  const hoverImg   = images[1]?.url ?? "";

  // Unique sizes in order
  const sizes = [...new Set(variants.map(v => v.size))]
    .sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a);
      const bi = SIZE_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  // Unique colors (deduplicated by colorLabel)
  const colors = Array.from(
    new Map(variants.map(v => [v.colorLabel, v.colorHex ?? "#d4c8b8"])).entries()
  ).slice(0, 5);

  // Tags to show
  const tags: string[] = [];
  if (gender === "UNISEX") tags.push("Unisex");
  if (isNew) tags.push("New In");

  const isOutOfStock = (size: string) =>
    !variants.some(v => v.size === size && v.stockQuantity > 0);

  return (
    <div className="group flex flex-col">

      {/* ── Image ──────────────────────────────────────────────────────── */}
      <Link
        href={`/products/${slug}`}
        className="relative block overflow-hidden bg-[#f5f3f0]"
        style={{ aspectRatio: "2/3" }}
      >
        {primaryImg && !imgError ? (
          <>
            {/* Primary image */}
            <Image
              src={primaryImg}
              alt={name}
              fill
              className={`object-cover object-top transition-opacity duration-500 ${
                hoverImg ? "group-hover:opacity-0" : ""
              }`}
              sizes="(max-width:768px) 50vw, 25vw"
              onError={() => setImgError(true)}
            />
            {/* Hover / secondary image */}
            {hoverImg && (
              <Image
                src={hoverImg}
                alt={`${name} alternate`}
                fill
                className="object-cover object-top opacity-0 transition-opacity duration-500
                  group-hover:opacity-100"
                sizes="(max-width:768px) 50vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full bg-[#ede9e4] flex items-center justify-center">
            <span className="text-[9px] tracking-widest uppercase text-[#b8aea4] font-serif">
              No image
            </span>
          </div>
        )}

        {/* ── Sizes — slide up on hover ─────────────────────────────── */}
        {sizes.length > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 z-10
              translate-y-full group-hover:translate-y-0
              transition-transform duration-300 ease-out
              bg-white/96 flex items-center justify-center
              flex-wrap gap-x-3 gap-y-0.5 py-2.5 px-3"
          >
            {sizes.map(size => (
              <span
                key={size}
                className={`text-[10px] tracking-[0.06em] font-serif transition-colors ${
                  isOutOfStock(size)
                    ? "text-[#c8c0b8] line-through"
                    : "text-[#3a2e22]"
                }`}
              >
                {size}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* ── Text area ──────────────────────────────────────────────────── */}
      <div className="pt-2 pb-3">

        {/* Row 1: Tags (left) + Wishlist star (right) */}
        <div className="flex items-center justify-between gap-1 min-h-[16px]">
          <div className="flex items-center gap-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] italic tracking-[0.04em] text-[#3a2e22] font-serif"
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={e => { e.preventDefault(); setWished(w => !w); }}
            aria-label="Add to wishlist"
            className={`flex-shrink-0 transition-opacity hover:opacity-60 ${
              wished ? "text-[#3a2e22]" : "text-[#3a2e22]"
            }`}
          >
            <StarIcon filled={wished} />
          </button>
        </div>

        {/* Row 2: Script name (left) + Colour swatches (right) */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <Link
            href={`/products/${slug}`}
            className="leading-tight truncate hover:opacity-60 transition-opacity"
            style={{
              fontFamily: "var(--font-script), cursive",
              fontSize:   "clamp(13px, 1.8vw, 15px)",
              color:      "#1a1008",
            }}
          >
            {name}
          </Link>

          {/* Colour squares */}
          {colors.length > 0 && (
            <div className="flex items-center gap-[3px] flex-shrink-0">
              {colors.map(([label, hex]) => (
                <span
                  key={label}
                  title={label}
                  className="border border-[#e8e2db]"
                  style={{
                    width:           12,
                    height:          12,
                    backgroundColor: hex,
                    flexShrink:      0,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Row 3: Description / type */}
        <p className="text-[10.5px] tracking-[0.02em] text-[#8a7a6a] font-serif leading-snug mt-0.5 line-clamp-2">
          {description ?? type}
        </p>

        {/* Row 4: Price */}
        <p className="text-[10.5px] tracking-[0.02em] text-[#3a2e22] font-serif mt-0.5">
          {currency}{Number(basePrice).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
