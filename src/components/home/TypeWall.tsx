// src/components/home/TypeWall.tsx
// Oversized statement typography with hover / auto-cycle image reveals.

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "./ScrollReveal";
import LineReveal from "./LineReveal";

const REVEALS: { image: string }[] = [
  { image: "/images/typewall-black.jpg"  },
  { image: "/images/typewall-colour.jpg" },
];

export default function TypeWall() {
  const [active,  setActive]  = useState<number | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (!isTouch) return;
    const id = setInterval(() => {
      setActive(prev => (prev === null ? 0 : prev >= REVEALS.length - 1 ? null : prev + 1));
    }, 2800);
    return () => clearInterval(id);
  }, [isTouch]);

  const wordProps = (idx: number) => ({
    onMouseEnter: () => !isTouch && setActive(idx),
    onMouseLeave: () => !isTouch && setActive(null),
  });

  return (
    <section className="relative w-full overflow-hidden bg-[#111009]"
      style={{ minHeight: "min(88vh, 780px)" }}>

      {REVEALS.map((r, i) => (
        <div key={i}
          className="absolute inset-0 transition-opacity duration-700 ease-out pointer-events-none"
          style={{ opacity: active === i ? 1 : 0 }}>
          <Image src={r.image} alt="" fill className="object-cover object-center" sizes="100vw" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ))}

      <div className="relative z-10 flex flex-col justify-center px-5 md:px-[4vw] py-16"
        style={{ minHeight: "min(88vh, 780px)" }}>

        <ScrollReveal variant="fade" duration={800}>
          <p className="text-[10px] tracking-[0.35em] uppercase font-serif text-[#9a8a7a] mb-5">
            A word from the cutting table
          </p>
        </ScrollReveal>

        <LineReveal
          stagger={160}
          delay={150}
          className="select-none"
          lines={[
            <h2 key="line1" className="font-serif font-medium leading-[0.95] text-[#F1EFE8]"
              style={{ fontSize: "clamp(48px, 12vw, 168px)", letterSpacing: "-0.02em" }}>
              <span {...wordProps(0)}
                className={`inline-block cursor-default transition-colors duration-500 ${
                  active === 0 ? "text-white" : ""
                }`}>
                BLACK
              </span>{" "}
              <span className="inline-block text-[#6a5a4a]">IS</span>
            </h2>,
            <h2 key="line2" className="font-serif font-medium leading-[0.95] text-[#F1EFE8]"
              style={{ fontSize: "clamp(48px, 12vw, 168px)", letterSpacing: "-0.02em" }}>
              <span {...wordProps(1)}
                className={`inline-block cursor-default transition-all duration-500 ${
                  active === 1 ? "text-white line-through decoration-[3px] decoration-[#c45a2a]" : ""
                }`}>
                BORING
              </span>
              <span className="text-[#c45a2a]">..</span>
            </h2>,
          ]}
        />

        <ScrollReveal variant="fade-up" delay={500} distance={22}>
          <p className="text-[#c8beb2] text-[12.5px] md:text-[14px] font-serif leading-relaxed
            tracking-[0.03em] mt-7 max-w-[460px]">
            Studded leather. Corduroy in bloodshot red. A suit the colour of
            midday sun. We cut for the ones who don&apos;t dress to disappear.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={680} distance={18}>
          <div className="mt-8">
            <Link
              href="/collections/woman"
              className="inline-block text-[11px] tracking-[0.2em] uppercase font-serif text-[#F1EFE8]
                border border-[#F1EFE8]/40 px-6 py-3 hover:bg-[#F1EFE8] hover:text-[#111009]
                transition-colors duration-300"
            >
              Explore the Colour Edit
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
