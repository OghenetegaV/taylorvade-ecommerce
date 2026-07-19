// src/components/ProductCard.tsx
// Monochrome restyle: black/white dominant, brown (#8B5E3C) only as accent.
// No borders — whitespace does the separation.

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "#111" : "none"} stroke="#111"
    strokeWidth="0.85" className="w-[15px] h-[15px] flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
  </svg>
);

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
  gender?:     string;
  images:      { url: string }[];
  variants:    ProductVariant[];
}

const SIZE_ORDER = ["XXS","XS","S","M","L","XL","XXL","XXXL","One Size"];

export default function ProductCard({
  slug, name, type, description, basePrice, currency = "₦",
  isNew, gender, images = [], variants = [],
}: ProductCardProps) {
  const [wished,   setWished]   = useState(false);
  const [imgError, setImgError] = useState(false);

  const primaryImg = images[0]?.url ?? "";
  const hoverImg   = images[1]?.url ?? "";

  const sizes = [...new Set(variants.map(v => v.size))].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const colors = Array.from(
    new Map(variants.map(v => [v.colorLabel, v.colorHex ?? "#ddd"])).entries()
  ).slice(0, 5);

  const isOutOfStock = (size: string) =>
    !variants.some(v => v.size === size && v.stockQuantity > 0);

  return (
    <div className="group flex flex-col">

      {/* Image */}
      <Link href={`/products/${slug}`}
        className="relative block overflow-hidden bg-[#f5f5f4]"
        style={{ aspectRatio: "2/3" }}>
        {primaryImg && !imgError ? (
          <>
            <Image src={primaryImg} alt={name} fill
              className={`object-cover object-top transition-opacity duration-500 ${
                hoverImg ? "group-hover:opacity-0" : ""
              }`}
              sizes="(max-width:768px) 50vw, 25vw"
              onError={() => setImgError(true)} />
            {hoverImg && (
              <Image src={hoverImg} alt={`${name} alternate`} fill
                className="object-cover object-top opacity-0 transition-opacity duration-500
                  group-hover:opacity-100"
                sizes="(max-width:768px) 50vw, 25vw" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[9px] tracking-widest uppercase text-[#c4c4c2] font-serif">
              No image
            </span>
          </div>
        )}

        {/* Sizes slide up on hover */}
        {sizes.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-10
            translate-y-full group-hover:translate-y-0
            transition-transform duration-300 ease-out
            bg-white/95 flex items-center justify-center
            flex-wrap gap-x-3 gap-y-0.5 py-2.5 px-3">
            {sizes.map(size => (
              <span key={size}
                className={`text-[10px] tracking-[0.06em] font-serif ${
                  isOutOfStock(size) ? "text-[#c4c4c2] line-through" : "text-[#111]"
                }`}>
                {size}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Text */}
      <div className="pt-2.5 pb-1">
        {/* Tags + wishlist */}
        <div className="flex items-center justify-between gap-1 min-h-[15px]">
          <div className="flex items-center gap-2">
            {gender === "UNISEX" && (
              <span className="text-[9.5px] italic tracking-[0.04em] text-[#999] font-serif">
                Unisex
              </span>
            )}
            {isNew && (
              <span className="text-[9.5px] italic tracking-[0.04em] text-[#8B5E3C] font-serif">
                New In
              </span>
            )}
          </div>
          <button
            onClick={e => { e.preventDefault(); setWished(w => !w); }}
            aria-label="Add to wishlist"
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-60">
            <StarIcon filled={wished} />
          </button>
        </div>

        {/* Name + swatches */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <Link href={`/products/${slug}`}
            className="leading-tight truncate hover:opacity-50 transition-opacity"
            style={{
              fontFamily: "var(--font-script), cursive",
              fontSize:   "clamp(13px, 1.8vw, 15px)",
              color:      "#111",
            }}>
            {name}
          </Link>
          {colors.length > 1 && (
            <div className="flex items-center gap-[3px] flex-shrink-0">
              {colors.map(([label, hex]) => (
                <span key={label} title={label}
                  style={{ width: 11, height: 11, backgroundColor: hex, flexShrink: 0 }} />
              ))}
            </div>
          )}
        </div>

        <p className="text-[10.5px] tracking-[0.02em] text-[#999] font-serif leading-snug mt-0.5 line-clamp-1">
          {description ?? type}
        </p>
        <p className="text-[11px] tracking-[0.02em] text-[#111] font-serif mt-1">
          {currency}{Number(basePrice).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
