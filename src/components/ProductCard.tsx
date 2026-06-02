"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface ProductCardProps {
  slug: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  tags?: string[];               // e.g. ["Notify Me When Available", "New In"]
  notifyMe?: boolean;            // shows "Notify Me When Available" tag
  isNew?: boolean;               // shows "New In" tag
  swatches?: { color: string; label: string }[];
  image: string;
  hoverImage?: string;           // optional second image on hover
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.2"
    className="w-4 h-4 flex-shrink-0"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </svg>
);

export default function ProductCard({
  slug,
  name,
  description,
  price,
  currency = "£",
  notifyMe = false,
  isNew = false,
  swatches = [],
  image,
  hoverImage,
}: ProductCardProps) {
  const [wished, setWished] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [activeSwatchIdx, setActiveSwatchIdx] = useState(0);

  return (
    <div className="group flex flex-col">

      {/* Image */}
      <Link href={`/products/${slug}`} className="block relative overflow-hidden bg-[#f0eeeb] aspect-[2/3] w-full">
        <Image
          src={hovered && hoverImage ? hoverImage : image}
          alt={description}
          fill
          className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </Link>

      {/* Info */}
      <div className="pt-2.5 pb-1">

        {/* Tags */}
        {(notifyMe || isNew) && (
          <div className="flex items-center gap-3 mb-1">
            {notifyMe && (
              <span className="text-[10px] tracking-wide text-[#1a1008] italic font-serif underline underline-offset-2 cursor-pointer hover:opacity-60 transition-opacity">
                Notify Me When Available
              </span>
            )}
            {isNew && (
              <span className="text-[10px] tracking-wide text-[#1a1008] italic font-serif">
                New In
              </span>
            )}
          </div>
        )}

        {/* Name row: script name + swatches + wishlist */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Script name */}
            <Link
              href={`/products/${slug}`}
              className="font-script text-lg text-[#1a1008] leading-tight whitespace-nowrap hover:opacity-60 transition-opacity"
              style={{ fontFamily: "var(--font-script), cursive" }}
            >
              {name}
            </Link>

            {/* Swatches */}
            {swatches.length > 0 && (
              <div className="flex items-center gap-1">
                {swatches.map((swatch, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSwatchIdx(i)}
                    title={swatch.label}
                    className={`w-3.5 h-3.5 flex-shrink-0 border transition-all ${
                      activeSwatchIdx === i
                        ? "border-[#1a1008] scale-110"
                        : "border-[#c8c0b8] hover:border-[#1a1008]"
                    }`}
                    style={{ backgroundColor: swatch.color }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={() => setWished(w => !w)}
            className={`flex-shrink-0 transition-opacity hover:opacity-60 ${wished ? "text-[#1a1008]" : "text-[#1a1008]"}`}
            aria-label="Add to wishlist"
          >
            <StarIcon filled={wished} />
          </button>
        </div>

        {/* Description */}
        <p className="text-[11px] text-[#1a1008] leading-snug tracking-wide mt-0.5 font-serif pr-4">
          {description}
        </p>

        {/* Price */}
        <p className="text-[11px] text-[#1a1008] tracking-wide mt-1 font-serif">
          {currency}{price.toLocaleString()}
        </p>
      </div>
    </div>
  );
}