// src/components/CollectionPage.tsx
// Gallery-index redesign — clean monochrome:
// - Giant typographic header: WOMAN (42), no rules/borders anywhere
// - Text-only toolbar: Filter + / Sort, view density toggle (2-up / 4-up)
// - Working filter drawer: sizes, price range, in-stock (client-side over loaded set)
// - White gutters between cards (no grid lines), staggered reveal
// - Brown #8B5E3C used only as accent (SS mark, active states)

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ProductCard from "./ProductCard";

type Product = {
  id: string; name: string; slug: string; type: string;
  description?: string;
  basePrice: number; gender: string; isNew: boolean;
  images: { url: string }[];
  variants: {
    id: string; size: string; colorLabel: string;
    colorHex?: string | null; stockQuantity: number; priceOverride?: number | null;
  }[];
};

const SORT_OPTIONS = [
  { label: "Newest",             sortBy: "createdAt", order: "desc" as const },
  { label: "Price · Low to High", sortBy: "basePrice", order: "asc"  as const },
  { label: "Price · High to Low", sortBy: "basePrice", order: "desc" as const },
  { label: "Name · A–Z",          sortBy: "name",      order: "asc"  as const },
];

const ALL_SIZES = ["XS","S","M","L","XL","XXL"];
const FETCH_LIMIT = 60; // fetch generously; filters run client-side

interface Props { title: string; gender: "WOMEN" | "MEN" | "UNISEX"; }

export default function CollectionPage({ title, gender }: Props) {
  const [products,   setProducts]   = useState<Product[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [loaded,     setLoaded]     = useState(false);
  const [sortIdx,    setSortIdx]    = useState(0);
  const [sortOpen,   setSortOpen]   = useState(false);
  const [dense,      setDense]      = useState(true);   // true = 4-up, false = 2-up
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [fSizes,   setFSizes]   = useState<string[]>([]);
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
      gender, sortBy: sort.sortBy, order: sort.order,
      page: "1", limit: String(FETCH_LIMIT),
    });
    try {
      const res  = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products);
        setTotal(data.data.pagination.total);
      }
    } catch {}
    setLoading(false);
    setLoaded(true);
  }, [gender, sort.sortBy, sort.order]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

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
      const price = Number(product.basePrice);
      if (fMin && price < parseFloat(fMin)) return false;
      if (fMax && price > parseFloat(fMax)) return false;
      return true;
    });
  }, [products, fSizes, fMin, fMax, fInStock]);

  const activeFilterCount =
    (fSizes.length > 0 ? 1 : 0) + (fMin || fMax ? 1 : 0) + (fInStock ? 1 : 0);

  function clearFilters() {
    setFSizes([]); setFMin(""); setFMax(""); setFInStock(false);
  }

  function toggleSize(size: string) {
    setFSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  }

  const gridCols = dense
    ? "grid-cols-2 md:grid-cols-4"
    : "grid-cols-1 md:grid-cols-2";

  return (
    <div className="bg-white min-h-screen font-serif">
      <div className="h-[76px] md:h-[88px]" />

      {/* ── Index header — typography only, no rules ── */}
      <div className="px-5 md:px-12 pt-10 md:pt-16 pb-6 md:pb-10">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-[#111] font-medium leading-[0.9] uppercase"
            style={{ fontSize: "clamp(52px, 10vw, 128px)", letterSpacing: "-0.03em" }}>
            {title}
          </h1>
          <span className="text-[13px] md:text-[16px] text-[#111] flex-shrink-0">
            ({loading ? "…" : filtered.length})
          </span>
        </div>
        <p className="mt-2 text-[13px] italic text-[#8B5E3C]"
          style={{ fontFamily: "var(--font-script), cursive" }}>
          Spring Summer &apos;26
        </p>
      </div>

      {/* ── Toolbar — text only ── */}
      <div className="sticky top-[76px] md:top-[88px] z-20 bg-white/95 backdrop-blur-sm
        px-5 md:px-12 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => setDrawerOpen(true)}
            className="text-[11px] tracking-[0.08em] uppercase text-[#111]
              underline-offset-4 hover:underline">
            Filter{activeFilterCount > 0 && (
              <span className="text-[#8B5E3C]"> ({activeFilterCount})</span>
            )} +
          </button>

          {/* Sort */}
          <div ref={sortRef} className="relative">
            <button onClick={() => setSortOpen(o => !o)}
              className="text-[11px] tracking-[0.08em] uppercase text-[#111]
                underline-offset-4 hover:underline">
              Sort · {SORT_OPTIONS[sortIdx].label.split(" · ")[0]}
            </button>
            {sortOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white shadow-lg z-30 min-w-[190px] py-1">
                {SORT_OPTIONS.map((opt, i) => (
                  <button key={i}
                    onClick={() => { setSortIdx(i); setSortOpen(false); }}
                    className={`block w-full text-left px-4 py-2.5 text-[11px] tracking-[0.05em]
                      hover:bg-[#f7f7f6] transition-colors ${
                      i === sortIdx ? "text-[#8B5E3C]" : "text-[#111]"
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View density toggle */}
        <div className="flex items-center gap-3">
          <button onClick={() => setDense(false)} aria-label="Large view"
            className={`transition-opacity ${dense ? "opacity-30 hover:opacity-60" : "opacity-100"}`}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="0.5" y="0.5" width="6" height="14" stroke="#111"/>
              <rect x="8.5" y="0.5" width="6" height="14" stroke="#111"/>
            </svg>
          </button>
          <button onClick={() => setDense(true)} aria-label="Compact view"
            className={`transition-opacity ${dense ? "opacity-100" : "opacity-30 hover:opacity-60"}`}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="0.5" y="0.5" width="2.6" height="14" stroke="#111"/>
              <rect x="4.7" y="0.5" width="2.6" height="14" stroke="#111"/>
              <rect x="8.9" y="0.5" width="2.6" height="14" stroke="#111"/>
              <rect x="13.1" y="0.5" width="1.4" height="14" stroke="#111"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Grid — white gutters, no lines ── */}
      <div className="px-5 md:px-12 pt-4 pb-16">
        {loading ? (
          <div className={`grid ${gridCols} gap-x-4 gap-y-10`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-[#f5f5f4]" style={{ aspectRatio: "2/3" }} />
                <div className="h-3 bg-[#f5f5f4] rounded w-2/3 mt-3" />
                <div className="h-2.5 bg-[#f5f5f4] rounded w-1/3 mt-1.5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-[13px] text-[#111] mb-2">Nothing matches those filters.</p>
            <button onClick={clearFilters}
              className="text-[11px] tracking-[0.08em] uppercase text-[#8B5E3C]
                underline underline-offset-4">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-x-4 gap-y-10`}>
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

        {/* Count footer */}
        {!loading && filtered.length > 0 && (
          <p className="text-center text-[10.5px] tracking-[0.15em] uppercase text-[#999] mt-14">
            Showing {filtered.length} of {total}
          </p>
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
          <p className="text-[12px] tracking-[0.2em] uppercase text-[#111]">Filter</p>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close filters"
            className="text-[#111] text-[18px] leading-none hover:opacity-50 transition-opacity">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-8 py-2">
          {/* Sizes */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#999] mb-3">Size</p>
            <div className="grid grid-cols-3 gap-2">
              {ALL_SIZES.map(size => {
                const on = fSizes.includes(size);
                return (
                  <button key={size} onClick={() => toggleSize(size)}
                    className={`py-2.5 text-[11px] tracking-[0.05em] transition-colors ${
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
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#999] mb-3">Price (₦)</p>
            <div className="flex items-center gap-3">
              <input type="number" min="0" placeholder="Min" value={fMin}
                onChange={e => setFMin(e.target.value)}
                className="w-full bg-[#f5f5f4] px-3 py-2.5 text-[12px] text-[#111]
                  placeholder:text-[#bbb] outline-none focus:bg-[#ececea] transition-colors" />
              <span className="text-[#999] text-[11px]">—</span>
              <input type="number" min="0" placeholder="Max" value={fMax}
                onChange={e => setFMax(e.target.value)}
                className="w-full bg-[#f5f5f4] px-3 py-2.5 text-[12px] text-[#111]
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
            <span className="text-[12px] text-[#111]">In stock only</span>
          </button>
        </div>

        <div className="px-6 py-5 flex items-center gap-3">
          <button onClick={clearFilters}
            className="flex-1 py-3 text-[10.5px] tracking-[0.15em] uppercase text-[#111]
              bg-[#f5f5f4] hover:bg-[#ececea] transition-colors">
            Clear
          </button>
          <button onClick={() => setDrawerOpen(false)}
            className="flex-1 py-3 text-[10.5px] tracking-[0.15em] uppercase text-white
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
