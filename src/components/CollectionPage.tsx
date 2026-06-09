// src/components/CollectionPage.tsx
// Matches Manière De Voir collection page:
// - sticky sub-header: item count + sort/filter
// - edge-to-edge 4-col (desktop) / 2-col (mobile) grid
// - 3px gap between cards
// - fade-up animation on card entry
// - infinite scroll via "Load More"

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ProductCard from "./ProductCard";

type Product = {
  id: string; name: string; slug: string; type: string;
  basePrice: number; gender: string; isNew: boolean;
  isFeatured: boolean; isPublished: boolean;
  images: { url: string }[];
  variants: {
    id: string; size: string; colorLabel: string;
    colorHex?: string | null; stockQuantity: number; priceOverride?: number | null;
  }[];
};

type SortOption = {
  label: string;
  sortBy: string;
  order: "asc" | "desc";
};

const SORT_OPTIONS: SortOption[] = [
  { label: "Newest",              sortBy: "createdAt", order: "desc" },
  { label: "Price: Low to High",  sortBy: "basePrice", order: "asc"  },
  { label: "Price: High to Low",  sortBy: "basePrice", order: "desc" },
  { label: "Name: A–Z",           sortBy: "name",      order: "asc"  },
];

const ITEMS_PER_PAGE = 24;

interface Props {
  title:  string;  // "Woman" | "Man" | "Unisex"
  gender: "WOMEN" | "MEN" | "UNISEX";
}

export default function CollectionPage({ title, gender }: Props) {
  const [products,     setProducts]     = useState<Product[]>([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [sortIdx,      setSortIdx]      = useState(0);
  const [sortOpen,     setSortOpen]     = useState(false);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [search,       setSearch]       = useState("");
  const [loaded,       setLoaded]       = useState(false);
  const sortRef   = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const sort = SORT_OPTIONS[sortIdx];

  const fetchProducts = useCallback(async (pageNum: number, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams({
      gender,
      sortBy:  sort.sortBy,
      order:   sort.order,
      page:    String(pageNum),
      limit:   String(ITEMS_PER_PAGE),
      ...(search ? { q: search } : {}),
    });

    try {
      const res  = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(prev => reset ? data.data.products : [...prev, ...data.data.products]);
        setTotal(data.data.pagination.total);
      }
    } catch {}

    if (reset) { setLoading(false); setLoaded(true); }
    else setLoadingMore(false);
  }, [gender, sort.sortBy, sort.order, search]);

  // Reset and refetch when sort/search changes
  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
  }, [fetchProducts]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchProducts(next, false);
  }

  const hasMore = products.length < total;

  // Skeleton cards while loading
  const Skeleton = () => (
    <div className="animate-pulse">
      <div className="bg-[#f0eeeb]" style={{ aspectRatio: "2/3" }} />
      <div className="pt-2 px-0.5 space-y-1.5">
        <div className="h-2 bg-[#f0eeeb] rounded w-1/3" />
        <div className="h-3 bg-[#f0eeeb] rounded w-2/3" />
        <div className="h-2 bg-[#f0eeeb] rounded w-1/2" />
        <div className="h-2 bg-[#f0eeeb] rounded w-1/4" />
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen font-serif">

      {/* ── Spacer for fixed main header ── */}
      <div className="h-[76px] md:h-[88px]" />

      {/* ── Collection title ── */}
      <div className="text-center py-5 px-4 border-b border-[#f0eeeb]">
        <h1
          className="text-[32px] md:text-[40px] text-[#1a1008] leading-none"
          style={{ fontFamily: "var(--font-script), cursive" }}
        >
          Taylor Vade {title}
        </h1>
        {!loading && (
          <p className="text-[10px] tracking-[0.15em] text-[#9a8a7a] uppercase mt-1.5">
            {total} {total === 1 ? "Item" : "Items"}
          </p>
        )}
      </div>

      {/* ── Sticky sort / filter bar ── */}
      <div className="sticky top-[76px] md:top-[88px] z-20 bg-white border-b border-[#f0eeeb]
        flex items-center px-3 md:px-5 py-2.5 gap-4">

        {/* Sort By */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => { setSortOpen(o => !o); setFilterOpen(false); }}
            className="flex items-center gap-1.5 text-[10.5px] tracking-[0.1em]
              text-[#3a2e22] uppercase hover:opacity-60 transition-opacity"
          >
            Sort By
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
              stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
              className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}>
              <path d="M2 4l4 4 4-4"/>
            </svg>
          </button>

          {sortOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#e8e2db]
              shadow-sm z-30 min-w-[170px]">
              {SORT_OPTIONS.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => { setSortIdx(i); setSortOpen(false); }}
                  className={`block w-full text-left px-4 py-2.5 text-[10.5px] tracking-[0.06em]
                    hover:bg-[#f7f5f2] transition-colors font-serif
                    ${i === sortIdx ? "text-[#1a1008] font-semibold" : "text-[#5a4a3a]"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <span className="text-[#e8e2db] text-[14px]">|</span>

        {/* All Filters */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => { setFilterOpen(o => !o); setSortOpen(false); }}
            className="flex items-center gap-1.5 text-[10.5px] tracking-[0.1em]
              text-[#3a2e22] uppercase hover:opacity-60 transition-opacity"
          >
            All Filters
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
              stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
              className={`transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`}>
              <path d="M2 4l4 4 4-4"/>
            </svg>
          </button>

          {filterOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#e8e2db]
              shadow-sm z-30 w-[200px] p-4">
              <p className="text-[9px] tracking-[0.2em] text-[#9a8a7a] uppercase mb-3">
                Coming Soon
              </p>
              <p className="text-[10.5px] text-[#5a4a3a] font-serif">
                Size and colour filters will be available here.
              </p>
            </div>
          )}
        </div>

        {/* Spacer + item count on desktop */}
        <span className="ml-auto text-[10px] tracking-[0.12em] text-[#9a8a7a] hidden md:block">
          {loading ? "" : `${total} ${total === 1 ? "Item" : "Items"}`}
        </span>
      </div>

      {/* ── Product grid ────────────────────────────────────────────────
          gap-[3px] matches the tight 3px gap in the inspo.
          Edge-to-edge: no horizontal padding on the grid wrapper.
      ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[3px] bg-[#e8e2db]">

        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white"><Skeleton /></div>
            ))
          : products.length === 0
            ? (
                <div className="col-span-2 md:col-span-4 bg-white py-24 text-center">
                  <p className="text-[12px] tracking-[0.1em] text-[#9a8a7a] font-serif mb-2">
                    No products in this collection yet.
                  </p>
                  <p className="text-[10.5px] text-[#c8c0b8] font-serif">
                    Add products via the admin panel.
                  </p>
                </div>
              )
            : products.map((product, i) => (
                <div
                  key={product.id}
                  className="bg-white"
                  style={{
                    opacity: loaded ? 1 : 0,
                    animation: loaded
                      ? `tvCardIn 0.5s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 0.04, 0.4)}s both`
                      : undefined,
                  }}
                >
                  <ProductCard
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    type={product.type}
                    basePrice={product.basePrice}
                    isNew={product.isNew}
                    images={product.images}
                    variants={product.variants}
                  />
                </div>
              ))
        }
      </div>

      {/* ── Load More ── */}
      {!loading && hasMore && (
        <div className="flex justify-center py-10">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="border border-[#3a2e22] px-10 py-3 text-[10.5px] tracking-[0.2em]
              uppercase text-[#3a2e22] font-serif hover:bg-[#3a2e22] hover:text-white
              transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load More"}
          </button>
        </div>
      )}

      {/* ── Card entry animation keyframes ── */}
      <style>{`
        @keyframes tvCardIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
