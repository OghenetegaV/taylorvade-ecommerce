// src/components/home/ExitDoors.tsx
// Finale: two full-height portals into the shop.
// Hover: image zooms, panel widens slightly, label underlines.
// Mobile: stacked, each 55vh.

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "./ScrollReveal";

const DOORS = [
  { label: "Woman",  sub: "Enter the edit", href: "/collections/woman",  image: "/images/women.jpg" },
  { label: "Man",    sub: "Enter the edit", href: "/collections/man",    image: "/images/men.jpg"   },
];

export default function ExitDoors() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="bg-[#0d0d0d]">
      <ScrollReveal>
        <div className="text-center pt-14 pb-8">
          <p className="text-[11.5px] tracking-[0.35em] uppercase font-serif text-[#8f8f8a]">
            Where to next
          </p>
        </div>
      </ScrollReveal>

      <div className="flex flex-col md:flex-row" style={{ minHeight: "78vh" }}>
        {DOORS.map((door, i) => (
          <ScrollReveal key={door.label} variant="clip-up" delay={i * 160} duration={1000}
            className="flex"
            style={{
              flex: hovered === null ? 1 : hovered === i ? 1.18 : 0.82,
              transition: "flex 0.7s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
          <Link
            href={door.href}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="relative overflow-hidden group block w-full"
            style={{ minHeight: "55vh" }}
          >
            <Image
              src={door.image} alt={`Taylor Vade ${door.label}`} fill
              className="object-cover object-top transition-transform duration-[1.2s] ease-out
                group-hover:scale-[1.06]"
              sizes="(max-width:768px) 100vw, 50vw"
            />
            <div className={`absolute inset-0 transition-colors duration-500 ${
              hovered === i ? "bg-black/10" : "bg-black/35"
            }`} />

            {/* Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span className="text-white leading-none"
                style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(44px,6vw,84px)" }}>
                {door.label}
              </span>
              <span className={`text-[11.5px] tracking-[0.3em] uppercase font-serif text-white/85
                border-b pb-1 transition-colors duration-300 ${
                hovered === i ? "border-white" : "border-transparent"
              }`}>
                {door.sub} →
              </span>
            </div>
          </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
