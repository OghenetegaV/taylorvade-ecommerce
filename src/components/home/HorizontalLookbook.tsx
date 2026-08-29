// src/components/home/HorizontalLookbook.tsx
// Pinned horizontal lookbook:
// - Desktop: section pins for 260vh; vertical scroll drives the track sideways (rAF + transform3d)
// - Mobile / reduced-motion: native horizontal scroll with snap (better UX, zero jank)
// Fetches the latest published products from /api/products.

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "./ScrollReveal";

type Product = {
  id: string; name: string; slug: string; type: string;
  basePrice: number; isNew: boolean;
  images: { url: string }[];
};

const SCROLL_LENGTH_VH = 260; // how long the pin lasts

function ngn(n: number) {
  return `₦${Number(n).toLocaleString()}`;
}

export default function HorizontalLookbook() {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [staticMode, setStaticMode] = useState(false); // mobile / reduced motion

  useEffect(() => {
    const coarse  = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow  = window.innerWidth < 768;
    setStaticMode(coarse || reduced || narrow);
  }, []);

  useEffect(() => {
    fetch("/api/products?limit=10&sortBy=createdAt&order=desc")
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data.products); })
      .catch(() => {});
  }, []);

  // Scroll-linked horizontal drive (desktop only)
  const update = useCallback(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    if (!outer || !track) return;
    const rect = outer.getBoundingClientRect();
    const vh   = window.innerHeight;
    const total = outer.offsetHeight - vh;         // scrollable distance while pinned
    const p = Math.min(1, Math.max(0, -rect.top / total));
    const maxX = track.scrollWidth - window.innerWidth;
    track.style.transform = `translate3d(${(-p * maxX).toFixed(1)}px,0,0)`;
  }, []);

  useEffect(() => {
    if (staticMode) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => { update(); ticking = false; });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [staticMode, update]);

  if (products.length === 0) return null;

  const Card = ({ product, tall }: { product: Product; tall: boolean }) => (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex-shrink-0 overflow-hidden bg-[#f5f5f4]"
      style={{
        width:  tall ? "clamp(240px, 24vw, 360px)" : "clamp(200px, 20vw, 300px)",
        height: tall ? "min(72vh, 640px)"          : "min(58vh, 520px)",
        alignSelf: tall ? "center" : "flex-end",
      }}
    >
      {product.images[0] && (
        <Image
          src={product.images[0].url} alt={product.name} fill
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
          sizes="26vw"
        />
      )}
      {/* Price chip on hover */}
      <div className="absolute left-3 bottom-3 bg-[#fafafa]/95 px-3 py-1.5
        opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
        transition-all duration-300">
        <p className="text-[13.5px] text-[#111] leading-tight"
          style={{ fontFamily: "var(--font-script), cursive" }}>
          {product.name}
        </p>
        <p className="text-[11.5px] text-[#555] font-serif">{ngn(product.basePrice)}</p>
      </div>
      {product.isNew && (
        <span className="absolute top-3 left-3 text-[10.5px] italic font-serif text-white
          bg-[#111]/80 px-2 py-0.5">
          New In
        </span>
      )}
    </Link>
  );

  // ── Mobile / reduced-motion: native snap scroll ────────────────────
  if (staticMode) {
    return (
      <section className="bg-[#fafafa] py-12">
        <ScrollReveal>
          <div className="px-5 mb-6 flex items-end justify-between">
            <h2 className="text-[26px] text-[#111] leading-none"
              style={{ fontFamily: "var(--font-script), cursive" }}>
              The Lookbook
            </h2>
            <span className="text-[11.5px] tracking-[0.15em] uppercase font-serif text-[#8f8f8a]">
              Swipe →
            </span>
          </div>
        </ScrollReveal>
        <div className="flex gap-3 overflow-x-auto px-5 pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}>
          {products.map((product, i) => (
            <div key={product.id} className="snap-start">
              <Card product={product} tall={i % 2 === 0} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ── Desktop: pinned horizontal drive ───────────────────────────────
  return (
    <div ref={outerRef} className="relative bg-[#fafafa]"
      style={{ height: `${SCROLL_LENGTH_VH}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">

        {/* Section label */}
        <div className="absolute top-[7vh] left-[4vw] z-10">
          <ScrollReveal variant="fade-up" distance={22}>
            <h2 className="text-[clamp(28px,3.5vw,44px)] text-[#111] leading-none"
              style={{ fontFamily: "var(--font-script), cursive" }}>
              The Lookbook
            </h2>
            <p className="text-[11.5px] tracking-[0.3em] uppercase font-serif text-[#8f8f8a] mt-2">
              Spring Summer &apos;26 — keep scrolling
            </p>
          </ScrollReveal>
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          className="flex items-center gap-[2.2vw] pl-[26vw] pr-[8vw]"
          style={{ willChange: "transform", height: "78vh" }}
        >
          {products.map((product, i) => (
            <Card key={product.id} product={product} tall={i % 2 === 0} />
          ))}

          {/* End card → collection */}
          <Link href="/collections/woman"
            className="flex-shrink-0 flex flex-col items-center justify-center gap-3
              border border-[#111]/25 hover:border-[#111] transition-colors duration-300
              text-center px-10"
            style={{ width: "clamp(220px,22vw,320px)", height: "min(58vh,520px)", alignSelf: "center" }}>
            <span className="text-[24px] text-[#111] leading-tight"
              style={{ fontFamily: "var(--font-script), cursive" }}>
              View the full collection
            </span>
            <span className="text-[11.5px] tracking-[0.25em] uppercase font-serif text-[#555]">
              Shop now →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
