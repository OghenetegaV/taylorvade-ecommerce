"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="1" className="w-[18px] h-[18px]">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
  </svg>
);

export interface ProductVariant {
  id: string;
  size: string;
  colorLabel: string;
  colorHex?: string | null;
  stockQuantity: number;
  priceOverride?: number | null;
}

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  type: string;
  basePrice: number;
  currency?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  images: { url: string }[];
  variants: ProductVariant[];
  // legacy compat
  description?: string;
  notifyMe?: boolean;
}

export default function ProductCard({
  slug, name, type, basePrice, currency = "₦",
  isNew, images, variants = [],
}: ProductCardProps) {
  const [wished,   setWished]   = useState(false);
  const [imgError, setImgError] = useState(false);

  // Unique sizes in order
  const sizeOrder = ["XXS","XS","S","M","L","XL","XXL","XXXL","One Size"];
  const sizes = [...new Set(variants.map(v => v.size))]
    .sort((a, b) => {
      const ai = sizeOrder.indexOf(a);
      const bi = sizeOrder.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const price    = Number(basePrice).toLocaleString();
  const imgSrc   = images[0]?.url;
  const hoverSrc = images[1]?.url ?? images[0]?.url;

  return (
    <div className="group flex flex-col bg-white">

      {/* ── Image container ── */}
      <Link href={`/products/${slug}`} className="block relative overflow-hidden"
        style={{ aspectRatio: "2/3" }}>

        {imgSrc && !imgError ? (
          <>
            {/* Primary image */}
            <Image
              src={imgSrc} alt={name} fill
              className="object-cover object-top transition-opacity duration-500
                group-hover:opacity-0"
              sizes="(max-width:768px) 50vw, 25vw"
              onError={() => setImgError(true)}
            />
            {/* Hover image */}
            {hoverSrc && (
              <Image
                src={hoverSrc} alt={name} fill
                className="object-cover object-top opacity-0 transition-opacity duration-500
                  group-hover:opacity-100"
                sizes="(max-width:768px) 50vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full bg-[#f0eeeb] flex items-center justify-center">
            <span className="text-[#c8c0b8] text-[10px] tracking-widest uppercase font-serif">
              No image
            </span>
          </div>
        )}

        {/* Wishlist — top right, fades in on hover */}
        <button
          onClick={e => { e.preventDefault(); setWished(w => !w); }}
          aria-label="Add to wishlist"
          className={`absolute top-2.5 right-2.5 z-10 transition-all duration-200
            md:opacity-0 md:group-hover:opacity-100
            ${wished ? "text-[#3a2e22]" : "text-[#3a2e22]"}`}
        >
          <StarIcon filled={wished} />
        </button>

        {/* Sizes — slide up from bottom on hover */}
        {sizes.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/95
            translate-y-full group-hover:translate-y-0
            transition-transform duration-300 ease-out
            flex items-center justify-center gap-2.5 py-2.5 px-2">
            {sizes.map(size => {
              const inStock = variants.some(
                v => v.size === size && v.stockQuantity > 0
              );
              return (
                <span key={size}
                  className={`text-[10px] tracking-[0.05em] font-serif transition-opacity
                    ${inStock ? "text-[#3a2e22]" : "text-[#c8c0b8] line-through"}`}>
                  {size}
                </span>
              );
            })}
          </div>
        )}
      </Link>

      {/* ── Text area ── */}
      <div className="pt-2 pb-3 px-0.5">

        {/* Tag */}
        {isNew && (
          <p className="text-[9.5px] italic tracking-[0.04em] text-[#3a2e22] font-serif mb-0.5">
            New In
          </p>
        )}

        {/* Name row: script name + swatches */}
        <div className="flex items-center justify-between gap-1">
          <Link href={`/products/${slug}`}
            className="leading-tight hover:opacity-60 transition-opacity truncate"
            style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(13px,1.8vw,15px)", color: "#1a1008" }}>
            {name}
          </Link>
          {/* Colour swatches */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {[...new Map(variants.map(v => [v.colorLabel, v.colorHex])).entries()]
              .slice(0, 4)
              .map(([label, hex]) => (
                <span key={label} title={label}
                  className="w-2.5 h-2.5 rounded-full border border-[#e8e2db] flex-shrink-0"
                  style={{ backgroundColor: hex ?? "#d4c8b8" }}
                />
              ))}
          </div>
        </div>

        {/* Type */}
        <p className="text-[10.5px] tracking-[0.02em] text-[#8a7a6a] font-serif leading-tight mt-0.5">
          {type}
        </p>

        {/* Price */}
        <p className="text-[10.5px] tracking-[0.02em] text-[#3a2e22] font-serif mt-0.5">
          {currency}{price}
        </p>
      </div>
    </div>
  );
}
