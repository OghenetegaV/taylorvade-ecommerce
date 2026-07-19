"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ScrollReveal from "./ScrollReveal";

const IG_URL = "https://www.instagram.com/taylor_vade/";

const ALL_SHOTS = [
  { type: "image", src: "/images/vaders-1.jpg", handle: "@wearing.tv" },
  { type: "image", src: "/images/vaders-2.jpg", handle: "@lagosfit" },
  { type: "video", src: "/videos/vaders-3.mp4", handle: "@thevaders" },
  { type: "video", src: "/videos/vaders-4.mp4", handle: "@studio.days" },
  { type: "video", src: "/videos/vaders-5.mp4", handle: "@style.hub" },
  { type: "video", src: "/videos/vaders-6.mp4", handle: "@fashion.ng" },
];

export default function VadersStrip() {
  const [mounted, setMounted] = useState(false);
  const [shots, setShots] = useState(ALL_SHOTS.slice(0, 4));

  useEffect(() => {
    const shuffled = [...ALL_SHOTS].sort(() => 0.5 - Math.random());
    setShots(shuffled.slice(0, 4));
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section className="bg-[#0d0d0d] py-14 md:py-20">
      <ScrollReveal>
        <div className="text-center px-5">
          <p className="text-[10px] tracking-[0.35em] uppercase font-serif text-[#8f8f8a] mb-3">
            The community
          </p>
          <h2
            className="text-[#f5f5f5] leading-none"
            style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(30px,4.5vw,48px)" }}
          >
            The Vaders
          </h2>
          <p className="text-[#999] text-[12px] font-serif tracking-[0.04em] mt-3 mb-5">
            Worn by the discerning. Tag <span className="text-[#b5b5b0]">@taylor_vade</span> to be featured.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[3px] px-[3px]">
        {shots.map((shot, i) => (
          <ScrollReveal key={i} delay={i * 80}>
            <a
              href={IG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden bg-[#1a1a1a]"
              style={{ aspectRatio: "4/5" }}
            >
              {shot.type === "video" ? (
                <video
                  src={shot.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="object-cover object-center w-full h-full transition-transform duration-700 group-hover:scale-[1.05]"
                />
              ) : (
                <Image
                  src={shot.src}
                  alt={`Taylor Vade worn by ${shot.handle}`}
                  fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.05]"
                  sizes="(max-width:768px) 50vw, 25vw"
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-400" />
              <span
                className="absolute left-3 bottom-3 text-[10.5px] font-serif text-white
                opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0
                transition-all duration-300"
              >
                {shot.handle} ↗
              </span>
            </a>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}