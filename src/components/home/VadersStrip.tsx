// src/components/home/VadersStrip.tsx
// Community section — tagged customer shots linking to Instagram.
// Swap the placeholder images for real UGC: /images/vaders-1.jpg … vaders-4.jpg

"use client";

import Image from "next/image";
import ScrollReveal from "./ScrollReveal";

const IG_URL = "https://www.instagram.com/taylor_vade/";

const SHOTS = [
  { src: "/images/vaders-1.jpg", handle: "@wearing.tv"  },
  { src: "/images/vaders-2.jpg", handle: "@lagosfit"    },
  { src: "/images/vaders-3.jpg", handle: "@thevaders"   },
  { src: "/images/vaders-4.jpg", handle: "@studio.days" },
];

export default function VadersStrip() {
  return (
    <section className="bg-[#111009] py-14 md:py-20">
      <ScrollReveal>
        <div className="text-center px-5 mb-8 md:mb-10">
          <p className="text-[10px] tracking-[0.35em] uppercase font-serif text-[#9a8a7a] mb-3">
            The community
          </p>
          <h2 className="text-[#F1EFE8] leading-none"
            style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(30px,4.5vw,48px)" }}>
            The Vaders
          </h2>
          <p className="text-[#8a7a6a] text-[12px] font-serif tracking-[0.04em] mt-3">
            Worn by the discerning. Tag <span className="text-[#c8beb2]">@taylor_vade</span> to be featured.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[3px] px-[3px]">
        {SHOTS.map((shot, i) => (
          <ScrollReveal key={i} delay={i * 80}>
            <a href={IG_URL} target="_blank" rel="noopener noreferrer"
              className="group relative block overflow-hidden bg-[#1e1c17]"
              style={{ aspectRatio: "4/5" }}>
              <Image src={shot.src} alt={`Taylor Vade worn by ${shot.handle}`} fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.05]"
                sizes="(max-width:768px) 50vw, 25vw" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-400" />
              <span className="absolute left-3 bottom-3 text-[10.5px] font-serif text-white
                opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0
                transition-all duration-300">
                {shot.handle} ↗
              </span>
            </a>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
