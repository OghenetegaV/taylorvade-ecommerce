// src/components/home/MadeInLagos.tsx
// Craft story: process film beside provenance copy. Stacks on mobile.
// Video: /public/videos/process.mp4 (poster: /public/videos/process-poster.jpg)

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import ScrollReveal from "./ScrollReveal";

export default function MadeInLagos() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.35) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: [0, 0.35, 1] }
    );
    obs.observe(video);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="bg-[#FAF9F7]">
      <div className="flex flex-col md:flex-row">

        {/* Copy */}
        <div className="md:w-[44%] flex flex-col justify-center px-5 md:px-[4vw] py-14 md:py-24 order-2 md:order-1">
          <ScrollReveal>
            <p className="text-[10px] tracking-[0.3em] uppercase font-serif text-[#9a8a7a] mb-4">
              The Process
            </p>
            <h2 className="text-[#1a1008] leading-[1.05]"
              style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(32px,4.5vw,54px)" }}>
              Made in Lagos.
              <br />
              Worn everywhere.
            </h2>
            <p className="text-[#5a4a3a] text-[12.5px] md:text-[13.5px] font-serif leading-[1.9]
              tracking-[0.03em] mt-6 max-w-[420px]">
              Every piece starts as cloth on a cutting table in Lagos — measured twice,
              cut once, finished by hand. No mass runs. No shortcuts. When a jacket
              leaves our studio, it carries the hours that went into it.
            </p>
            <Link href="/about"
              className="inline-block mt-8 text-[10.5px] tracking-[0.2em] uppercase font-serif
                text-[#1a1008] border-b border-[#1a1008]/40 pb-1
                hover:border-[#1a1008] transition-colors">
              Our story
            </Link>
          </ScrollReveal>
        </div>

        {/* Film — cinematic wipe reveal */}
        <ScrollReveal variant="clip-up" duration={1100}
          className="md:w-[56%] relative order-1 md:order-2"
        >
        <div className="relative w-full h-full" style={{ minHeight: "min(64vh, 560px)" }}>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/process.mp4"
            poster="/videos/process-poster.jpg"
            muted loop playsInline preload="metadata"
          />
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
