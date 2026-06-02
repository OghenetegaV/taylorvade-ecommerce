"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ── Types ── */
export interface Product {
  slug: string;
  name: string;
  description: string;
  price?: number;
  notifyMe?: boolean;
  isNew?: boolean;
  swatches?: { color: string }[];
  image: string;
  hoverImage?: string;
}

interface CollectionPageProps {
  title: string;
  products: Product[];
}

/* ── Chevron ── */
const ChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>
);

/* ── Star icon ── */
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
  </svg>
);

/* ── Eiffel watermark ── */
const EiffelWatermark = () => (
  <svg width="60" height="86" viewBox="0 0 32 46" fill="none" className="opacity-10">
    <rect x="15" y="0" width="2" height="4" fill="#3a2e22"/>
    <polygon points="16,4 12,14 20,14" fill="#3a2e22"/>
    <polygon points="12,14 8,22 24,22 20,14" fill="#3a2e22"/>
    <line x1="8" y1="18" x2="24" y2="18" stroke="#3a2e22" strokeWidth="1.2"/>
    <polygon points="8,22 4,32 28,32 24,22" fill="#3a2e22"/>
    <line x1="4" y1="28" x2="28" y2="28" stroke="#3a2e22" strokeWidth="1.2"/>
    <polygon points="4,32 2,44 30,44 28,32" fill="#3a2e22"/>
  </svg>
);

/* ── Single product card (grid variant — full bleed) ── */
function GridCard({ product }: { product: Product }) {
  const [wished, setWished] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="group flex flex-col">
      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative overflow-hidden bg-[#f0eeeb]"
        style={{ aspectRatio: "2/3" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Image
          src={hovered && product.hoverImage ? product.hoverImage : product.image}
          alt={product.description}
          fill
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 50vw, 25vw"
        />
      </Link>

      {/* Info */}
      <div className="px-2 pt-2 pb-3">
        {/* Tags */}
        {(product.notifyMe || product.isNew) && (
          <div className="flex items-center gap-2 mb-0.5">
            {product.notifyMe && (
              <span className="text-[9.5px] tracking-wide text-[#1a1008] italic font-serif underline underline-offset-2">
                Notify Me When Available
              </span>
            )}
            {product.isNew && (
              <span className="text-[9.5px] tracking-wide text-[#1a1008] italic font-serif">
                New In
              </span>
            )}
          </div>
        )}

        {/* Name row */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className="font-script text-[17px] text-[#1a1008] leading-tight truncate hover:opacity-60 transition-opacity"
              style={{ fontFamily: "var(--font-script), cursive" }}
            >
              {product.name}
            </Link>
            {product.swatches && product.swatches.length > 0 && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {product.swatches.map((s, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 border border-[#c8c0b8]"
                    style={{ backgroundColor: s.color }}
                  />
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setWished(w => !w)}
            className="flex-shrink-0 text-[#1a1008] hover:opacity-50 transition-opacity"
          >
            <StarIcon filled={wished} />
          </button>
        </div>

        <p className="text-[10.5px] text-[#1a1008] leading-snug tracking-wide mt-0.5 font-serif pr-4 line-clamp-2">
          {product.description}
        </p>

        {product.price && (
          <p className="text-[10.5px] text-[#1a1008] tracking-wide mt-1 font-serif">
            £{product.price.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Main collection page ── */
export default function CollectionPage({ title, products }: CollectionPageProps) {
  const [sortOpen,   setSortOpen]   = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortValue,  setSortValue]  = useState("Featured");

  const sortOptions = ["Featured", "Newest", "Price: Low to High", "Price: High to Low"];

  return (
    <div className="min-h-screen bg-white font-serif">

      {/* ── Page title area ── */}
      <div className="pt-32 pb-4 text-center">
        <h1
          className="text-[42px] md:text-[52px] leading-tight text-[#1a1008]"
          style={{ fontFamily: "var(--font-script), cursive" }}
        >
          {title}
        </h1>
        <p className="text-[11px] tracking-[0.1em] text-[#8a7a6a] mt-1 font-serif">
          {products.length} Items
        </p>
      </div>

      {/* ── Sort / Filter bar ── */}
      <div className="flex items-center gap-0 px-4 md:px-6 py-3 border-b border-[#e8e2db]">
        {/* Sort By */}
        <div className="relative">
          <button
            onClick={() => { setSortOpen(o => !o); setFilterOpen(false); }}
            className="flex items-center gap-1.5 text-[11px] tracking-[0.08em] text-[#1a1008] font-serif hover:opacity-60 transition-opacity py-1 pr-4"
          >
            Sort By <ChevronDown />
          </button>
          {sortOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#e8e2db] z-30 min-w-[180px] shadow-md">
              {sortOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setSortValue(opt); setSortOpen(false); }}
                  className={`block w-full text-left px-4 py-2.5 text-[11px] tracking-[0.06em] font-serif hover:bg-[#f7f3ef] transition-colors ${
                    sortValue === opt ? "text-[#1a1008] font-medium" : "text-[#5a4a3a]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <span className="text-[#c8c0b8] text-sm mx-1 select-none">|</span>

        {/* All Filters */}
        <button
          onClick={() => { setFilterOpen(o => !o); setSortOpen(false); }}
          className="flex items-center gap-1.5 text-[11px] tracking-[0.08em] text-[#1a1008] font-serif hover:opacity-60 transition-opacity py-1 pl-4"
        >
          All Filters <ChevronDown />
        </button>
      </div>

      {/* ── Filter panel (expandable) ── */}
      {filterOpen && (
        <div className="border-b border-[#e8e2db] px-6 py-5 flex flex-wrap gap-8 bg-[#faf9f7]">
          {[
            { label: "Size", opts: ["XS", "S", "M", "L", "XL", "XXL"] },
            { label: "Colour", opts: ["Black", "White", "Brown", "Cream", "Olive", "Navy"] },
            { label: "Price", opts: ["Under £50", "£50–£100", "£100–£200", "Over £200"] },
          ].map(group => (
            <div key={group.label}>
              <p className="text-[10px] tracking-[0.15em] text-[#8a7a6a] uppercase mb-2 font-serif">{group.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.opts.map(opt => (
                  <button key={opt}
                    className="px-3 py-1 border border-[#c8c0b8] text-[10px] tracking-[0.06em] text-[#1a1008] font-serif hover:border-[#1a1008] transition-colors">
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Product grid — seamless, no gaps ── */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        {products.map((product, i) => (
          <div
            key={product.slug}
            className={`border-r border-b border-[#e8e2db] ${
              (i + 1) % 4 === 0 ? "border-r-0" : ""
            } ${
              (i + 1) % 2 === 0 ? "md:border-r-0 border-r-0 md:[&:not(:nth-child(4n))]:border-r" : ""
            }`}
          >
            <GridCard product={product} />
          </div>
        ))}
      </div>

      {/* ── Eiffel watermark ── */}
      <div className="flex justify-center py-16">
        <EiffelWatermark />
      </div>

    </div>
  );
}