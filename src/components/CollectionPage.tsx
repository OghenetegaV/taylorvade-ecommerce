// src/components/CollectionPage.tsx
// MDV-exact layout:
// - Centered script page title ("New In" style) + centered "{n} Items" count
// - Left toolbar row: Sort By ⌄ | All Filters ⌄ (divider between)
// - Full-bleed 4-up grid, images flush edge-to-edge, starts right after toolbar
// - Filter drawer + sort logic unchanged underneath

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";

type Product = {
  id: string; name: string; slug: string; type: string;
  description?: string;
  basePrice: number; gender: string; isNew: boolean;
  category?: { id: string; name: string; slug: string } | null;
  images: { url: string }[];
  variants: {
    id: string; size: string; colorLabel: string;
    colorHex?: string | null; stockQuantity: number; priceOverride?: number | null;
  }[];
};

const SORT_OPTIONS = [
  { label: "Newest",              sortBy: "createdAt", order: "desc" as const },
  { label: "Price · Low to High", sortBy: "basePrice", order: "asc"  as const },
  { label: "Price · High to Low", sortBy: "basePrice", order: "desc" as const },
  { label: "Name · A–Z",          sortBy: "name",      order: "asc"  as const },
];

const ALL_SIZES = ["XS","S","M","L","XL","XXL"];
const FETCH_LIMIT = 60; // fetch generously; filters run client-side

interface Props { title: string; gender?: "WOMEN" | "MEN" | "UNISEX"; }

export default function CollectionPage({ title, gender }: Props) {
  const searchParams = useSearchParams();
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loaded,     setLoaded]     = useState(false);
  const [sortIdx,    setSortIdx]    = useState(0);
  const [sortOpen,   setSortOpen]   = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [fSizes,      setFSizes]      = useState<string[]>([]);
  const [fCategories, setFCategories] = useState<string[]>(() => {
    const c = searchParams.get("category");
    return c ? [c] : [];
  });
  const [fColors,  setFColors]  = useState<string[]>([]);
  const [fMin,     setFMin]     = useState("");
  const [fMax,     setFMax]     = useState("");
  const [fInStock, setFInStock] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const sort = SORT_OPTIONS[sortIdx];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      sortBy: sort.sortBy, order: sort.order,
      page: "1", limit: String(FETCH_LIMIT),
    });
    if (gender) params.set("gender", gender);
    try {
      const res  = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch {}
    setLoading(false);
    setLoaded(true);
  }, [gender, sort.sortBy, sort.order]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Available category/colour options, derived from the fetched product set.
  const categoryOptions = useMemo(() => {
    const seen = new Map<string, string>(); // slug -> name
    for (const p of products) if (p.category) seen.set(p.category.slug, p.category.name);
    return Array.from(seen.entries());
  }, [products]);

  const colorOptions = useMemo(() => {
    const seen = new Map<string, string | null>(); // label -> hex
    for (const p of products) for (const v of p.variants) {
      if (!seen.has(v.colorLabel)) seen.set(v.colorLabel, v.colorHex ?? null);
    }
    return Array.from(seen.entries());
  }, [products]);

  // ── Client-side filtering ──────────────────────────────────────────
  const filtered = useMemo(() => {
    return products.filter(product => {
      if (fSizes.length > 0) {
        const has = product.variants.some(v =>
          fSizes.includes(v.size) && (!fInStock || v.stockQuantity > 0)
        );
        if (!has) return false;
      }
      if (fInStock && fSizes.length === 0) {
        if (!product.variants.some(v => v.stockQuantity > 0)) return false;
      }
      if (fCategories.length > 0) {
        if (!product.category || !fCategories.includes(product.category.slug)) return false;
      }
      if (fColors.length > 0) {
        if (!product.variants.some(v => fColors.includes(v.colorLabel))) return false;
      }
      const price = Number(product.basePrice);
      if (fMin && price < parseFloat(fMin)) return false;
      if (fMax && price > parseFloat(fMax)) return false;
      return true;
    });
  }, [products, fSizes, fCategories, fColors, fMin, fMax, fInStock]);

  const activeFilterCount =
    (fSizes.length > 0 ? 1 : 0) + (fCategories.length > 0 ? 1 : 0) + (fColors.length > 0 ? 1 : 0) +
    (fMin || fMax ? 1 : 0) + (fInStock ? 1 : 0);

  function clearFilters() {
    setFSizes([]); setFCategories([]); setFColors([]); setFMin(""); setFMax(""); setFInStock(false);
  }

  function toggleSize(size: string) {
    setFSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  }
  function toggleCategory(slug: string) {
    setFCategories(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  }
  function toggleColor(label: string) {
    setFColors(prev => prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]);
  }

  // Script-case title: "WOMAN" → "Woman"
  const displayTitle = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();

  return (
    <div className="bg-white min-h-screen font-serif">
      <div className="h-[76px] md:h-[88px]" />

      {/* ── Centered script title + item count (MDV) ── */}
      <div className="pt-4 md:pt-6 pb-4 text-center">
        <h1 className="text-[#111]"
          style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(30px, 4vw, 40px)" }}>
          {displayTitle}
        </h1>
        <p className="mt-2 text-[13.5px] tracking-[0.12em] text-[#8f8f8a]">
          {loading ? "…" : `${filtered.length} Items`}
        </p>
      </div>

      {/* ── Toolbar — Sort By | All Filters, left-aligned (MDV) ── */}
      <div className="px-3 md:px-6 pb-4 flex items-center gap-5">
        {/* Sort By */}
        <div ref={sortRef} className="relative">
          <button onClick={() => setSortOpen(o => !o)}
            className="flex items-center gap-1.5 text-[13.5px] tracking-[0.14em] text-[#111]
              hover:opacity-60 transition-opacity">
            Sort By
            <svg width="9" height="6" viewBox="0 0 10 6" fill="none"
              className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}>
              <path d="M1 1L5 5L9 1" stroke="#111" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          </button>
          <div
            className="absolute top-full left-0 mt-3 bg-white shadow-lg z-30 min-w-[200px]
              overflow-hidden origin-top transition-all duration-350 ease-in-out"
            style={{
              maxHeight: sortOpen ? SORT_OPTIONS.length * 40 + 8 : 0,
              opacity: sortOpen ? 1 : 0,
              transform: sortOpen ? "scaleY(1)" : "scaleY(0.85)",
            }}
          >
            <div className="py-1">
              {SORT_OPTIONS.map((opt, i) => (
                <button key={i}
                  onClick={() => { setSortIdx(i); setSortOpen(false); }}
                  className={`block w-full text-left px-4 py-2.5 text-[13px] tracking-[0.05em]
                    hover:bg-[#f7f7f6] transition-colors ${
                    i === sortIdx ? "text-[#8B5E3C]" : "text-[#111]"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <span className="w-px h-[16px] bg-[#d4d4d0]" />

        {/* All Filters */}
        <button onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 text-[13.5px] tracking-[0.14em] text-[#111]
            hover:opacity-60 transition-opacity">
          All Filters{activeFilterCount > 0 && (
            <span className="text-[#8B5E3C]">({activeFilterCount})</span>
          )}
          <svg width="9" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="#111" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* ── Grid — full bleed, images flush (MDV) ── */}
      <div className="pb-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-1 md:gap-x-1.5 gap-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-[#f5f5f4]" style={{ aspectRatio: "2/3" }} />
                <div className="px-3 md:px-4">
                  <div className="h-3 bg-[#f5f5f4] rounded w-2/3 mt-3" />
                  <div className="h-2.5 bg-[#f5f5f4] rounded w-1/3 mt-1.5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-[14.5px] text-[#111] mb-2">Nothing matches those filters.</p>
            <button onClick={clearFilters}
              className="text-[12.5px] tracking-[0.08em] uppercase text-[#8B5E3C]
                underline underline-offset-4">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-1 md:gap-x-1.5 gap-y-6">
            {filtered.map((product, i) => (
              <div key={product.id}
                style={{
                  opacity: 0,
                  animation: loaded
                    ? `tvCardIn 0.55s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 0.045, 0.45)}s both`
                    : undefined,
                }}>
                <ProductCard
                  id={product.id} slug={product.slug} name={product.name}
                  type={product.type} description={product.description}
                  basePrice={product.basePrice} isNew={product.isNew}
                  gender={product.gender} images={product.images}
                  variants={product.variants}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Filter drawer ── */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-[90] bg-black/30 transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <div className={`fixed top-0 right-0 h-full w-[320px] max-w-[88vw] z-[100] bg-white
        flex flex-col transition-transform duration-300 ease-out ${
        drawerOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="flex items-center justify-between px-6 pt-7 pb-5">
          <p className="text-[13.5px] tracking-[0.2em] uppercase text-[#111]">Filter</p>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close filters"
            className="text-[#111] text-[19px] leading-none hover:opacity-50 transition-opacity">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-8 py-2">
          {/* Category */}
          {categoryOptions.length > 0 && (
            <div>
              <p className="text-[11.5px] tracking-[0.2em] uppercase text-[#999] mb-3">Category</p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(([slug, name]) => {
                  const on = fCategories.includes(slug);
                  return (
                    <button key={slug} onClick={() => toggleCategory(slug)}
                      className={`px-3 py-2 text-[12.5px] tracking-[0.05em] transition-colors ${
                        on ? "bg-[#111] text-white" : "bg-[#f5f5f4] text-[#111] hover:bg-[#ececea]"
                      }`}>
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Colour */}
          {colorOptions.length > 0 && (
            <div>
              <p className="text-[11.5px] tracking-[0.2em] uppercase text-[#999] mb-3">Colour</p>
              <div className="flex flex-wrap gap-3">
                {colorOptions.map(([label, hex]) => {
                  const on = fColors.includes(label);
                  return (
                    <button key={label} onClick={() => toggleColor(label)} title={label}
                      className={`w-7 h-7 rounded-full border transition-all ${
                        on ? "border-[#111] ring-1 ring-offset-2 ring-[#111]" : "border-[#d4d4d0]"
                      }`}
                      style={{ background: hex ?? "#e5e5e2" }} />
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes */}
          <div>
            <p className="text-[11.5px] tracking-[0.2em] uppercase text-[#999] mb-3">Size</p>
            <div className="grid grid-cols-3 gap-2">
              {ALL_SIZES.map(size => {
                const on = fSizes.includes(size);
                return (
                  <button key={size} onClick={() => toggleSize(size)}
                    className={`py-2.5 text-[12.5px] tracking-[0.05em] transition-colors ${
                      on ? "bg-[#111] text-white" : "bg-[#f5f5f4] text-[#111] hover:bg-[#ececea]"
                    }`}>
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price */}
          <div>
            <p className="text-[11.5px] tracking-[0.2em] uppercase text-[#999] mb-3">Price (₦)</p>
            <div className="flex items-center gap-3">
              <input type="number" min="0" placeholder="Min" value={fMin}
                onChange={e => setFMin(e.target.value)}
                className="w-full bg-[#f5f5f4] px-3 py-2.5 text-[13.5px] text-[#111]
                  placeholder:text-[#bbb] outline-none focus:bg-[#ececea] transition-colors" />
              <span className="text-[#999] text-[12.5px]">—</span>
              <input type="number" min="0" placeholder="Max" value={fMax}
                onChange={e => setFMax(e.target.value)}
                className="w-full bg-[#f5f5f4] px-3 py-2.5 text-[13.5px] text-[#111]
                  placeholder:text-[#bbb] outline-none focus:bg-[#ececea] transition-colors" />
            </div>
          </div>

          {/* Availability */}
          <button onClick={() => setFInStock(v => !v)}
            className="flex items-center gap-3 group">
            <span className={`w-[15px] h-[15px] flex items-center justify-center transition-colors ${
              fInStock ? "bg-[#111]" : "bg-[#f5f5f4] group-hover:bg-[#ececea]"
            }`}>
              {fInStock && (
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <span className="text-[13.5px] text-[#111]">In stock only</span>
          </button>
        </div>

        <div className="px-6 py-5 flex items-center gap-3">
          <button onClick={clearFilters}
            className="flex-1 py-3 text-[12px] tracking-[0.15em] uppercase text-[#111]
              bg-[#f5f5f4] hover:bg-[#ececea] transition-colors">
            Clear
          </button>
          <button onClick={() => setDrawerOpen(false)}
            className="flex-1 py-3 text-[12px] tracking-[0.15em] uppercase text-white
              bg-[#111] hover:bg-black transition-colors">
            View {filtered.length}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tvCardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
