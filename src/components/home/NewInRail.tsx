// src/components/home/NewInRail.tsx
// Horizontal swipe rail of the latest pieces. Native scroll-snap — perfect on phones.

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "./ScrollReveal";

type Product = {
  id: string; name: string; slug: string; type: string;
  basePrice: number; isNew: boolean;
  images: { url: string }[];
};

export default function NewInRail() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products?limit=8&sortBy=createdAt&order=desc")
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data.products); })
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="bg-[#fafafa] py-14 md:py-20">
      <ScrollReveal>
        <div className="flex items-end justify-between px-5 md:px-12 mb-6 md:mb-8">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase font-serif text-[#8f8f8a] mb-2">
              Just landed
            </p>
            <h2 className="text-[#111] leading-none"
              style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(28px,4vw,44px)" }}>
              Fresh off the table
            </h2>
          </div>
          <Link href="/collections/woman"
            className="text-[10px] tracking-[0.2em] uppercase font-serif text-[#555]
              border-b border-[#555]/40 pb-1 hover:border-[#111] hover:text-[#111]
              transition-colors whitespace-nowrap">
            View all
          </Link>
        </div>
      </ScrollReveal>

      <div className="flex gap-3 md:gap-4 overflow-x-auto px-5 md:px-12 pb-4
        snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
        {products.map((product, i) => (
          <ScrollReveal key={product.id} variant="fade-up" delay={Math.min(i * 90, 450)}
            distance={24} className="snap-start flex-shrink-0 w-[62vw] sm:w-[38vw] md:w-[240px]">
          <Link href={`/products/${product.slug}`} className="group block">
            <div className="relative overflow-hidden bg-[#f5f5f4]" style={{ aspectRatio: "2/3" }}>
              {product.images[0] && (
                <Image src={product.images[0].url} alt={product.name} fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                  sizes="(max-width:640px) 62vw, (max-width:768px) 38vw, 240px" />
              )}
              {product.isNew && (
                <span className="absolute top-2.5 left-2.5 text-[9px] italic font-serif
                  text-white bg-[#111]/85 px-2 py-0.5">
                  New In
                </span>
              )}
            </div>
            <div className="pt-2.5">
              <p className="text-[14px] text-[#111] leading-tight truncate"
                style={{ fontFamily: "var(--font-script), cursive" }}>
                {product.name}
              </p>
              <p className="text-[10.5px] text-[#999] font-serif mt-0.5 truncate">{product.type}</p>
              <p className="text-[11px] text-[#222] font-serif mt-0.5">
                ₦{Number(product.basePrice).toLocaleString()}
              </p>
            </div>
          </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
