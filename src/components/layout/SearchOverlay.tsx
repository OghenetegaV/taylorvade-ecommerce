// src/components/layout/SearchOverlay.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

type Product = {
  id: string; name: string; slug: string; type: string; basePrice: number;
  images: { url: string }[];
};

type Props = { open: boolean; onClose: () => void };

export default function SearchOverlay({ open, onClose }: Props) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Debounced search
  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        setResults(data.success ? data.data.products : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 320);
  }, []);

  useEffect(() => { search(query); }, [query, search]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[130] bg-black/50"
      />

      {/* Panel */}
      <div className="fixed inset-x-0 top-0 z-[140] bg-[#FAF9F7] px-5 md:px-9 pt-6 pb-8
        shadow-[0_8px_40px_rgba(58,46,34,0.15)]">

        {/* Input row — matches existing drawer search aesthetic */}
        <div className="flex items-center gap-3 border-b border-[#d5cec4] pb-3 mb-6">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3a2e22"
            strokeWidth="1.4" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Taylor Vade"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-[14.5px] tracking-[0.08em] outline-none bg-transparent
              text-[#3a2e22] placeholder:text-[#9a8a7a] font-serif"
          />
          <button onClick={onClose} aria-label="Close search">
            <X size={16} strokeWidth={1.3} className="text-[#3a2e22]" />
          </button>
        </div>

        {/* Results */}
        {loading && (
          <p className="text-[11.5px] tracking-[0.15em] text-[#9a8a7a] font-serif text-center py-4">
            Searching…
          </p>
        )}

        {!loading && query && results.length === 0 && (
          <p className="text-[11.5px] tracking-[0.12em] text-[#9a8a7a] font-serif text-center py-4">
            No results for &ldquo;{query}&rdquo;
          </p>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {results.map(product => (
              <Link key={product.id} href={`/products/${product.slug}`} onClick={onClose}
                className="flex flex-col gap-1.5 group">
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#f0eeeb]">
                  {product.images[0] ? (
                    <Image src={product.images[0].url} alt={product.name} fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width:640px) 45vw, 15vw" />
                  ) : (
                    <div className="w-full h-full bg-[#e8e2db]" />
                  )}
                </div>
                <p className="text-[12.5px] text-[#3a2e22] font-serif tracking-wide truncate
                  group-hover:opacity-60 transition-opacity"
                  style={{ fontFamily: "var(--font-script), cursive" }}>
                  {product.name}
                </p>
                <p className="text-[11.5px] text-[#9a8a7a] font-serif tracking-wide">
                  {product.type}
                </p>
              </Link>
            ))}
          </div>
        )}

        {!query && (
          <p className="text-[11.5px] tracking-[0.15em] text-[#9a8a7a] font-serif text-center py-4">
            Start typing to search
          </p>
        )}
      </div>
    </>
  );
}
