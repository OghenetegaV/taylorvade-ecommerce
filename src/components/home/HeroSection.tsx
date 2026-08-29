"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const SLIDES = [
  { src: "/images/women3.jpg", alt: "Taylor Vade Woman", href: "/collections/woman" },
  { src: "/images/men.jpg",   alt: "Taylor Vade Man",   href: "/collections/man"   },
];

const SLIDE_MS = 4500;

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [slide,   setSlide]   = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Mobile auto-slide (respects reduced motion)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative w-full overflow-hidden" style={{ height: "100svh" }}>

      {/* ── Mobile: sliding single image ── */}
      <div className="absolute inset-0 md:hidden overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width:      `${SLIDES.length * 100}%`,
            transform:  `translate3d(-${slide * (100 / SLIDES.length)}%, 0, 0)`,
            transition: "transform 1s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {SLIDES.map((s, i) => (
            <Link key={i} href={s.href} className="relative h-full block cursor-pointer" style={{ width: `${100 / SLIDES.length}%` }}>
              <Image
                src={s.src} alt={s.alt} fill priority={i === 0}
                className="object-cover object-top" sizes="100vw"
              />
            </Link>
          ))}
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`}
              className="p-1">
              <span className={`block w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                slide === i ? "bg-white w-4" : "bg-white/50"
              }`} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop: split panels with clip reveals ── */}
      <div className="absolute top-0 left-0 w-[calc(50%+2px)] h-full overflow-hidden hidden md:block">
        <Link 
          href="/collections/woman"
          className="relative block w-full h-full cursor-pointer"
          style={{
            clipPath:   mounted ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
            transform:  mounted ? "scale(1)" : "scale(1.06)",
            transition: "clip-path 1.3s cubic-bezier(0.16,1,0.3,1), transform 1.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <Image src="/images/women3.jpg" alt="Taylor Vade Woman" fill priority
            className="object-cover object-top" sizes="50vw" />
        </Link>
      </div>

      <div className="absolute top-0 right-0 w-[calc(50%+2px)] h-full overflow-hidden hidden md:block">
        <Link 
          href="/collections/man"
          className="relative block w-full h-full cursor-pointer"
          style={{
            clipPath:   mounted ? "inset(0% 0 0 0)" : "inset(100% 0 0 0)",
            transform:  mounted ? "scale(1)" : "scale(1.06)",
            transition: "clip-path 1.3s cubic-bezier(0.16,1,0.3,1) 0.15s, transform 1.6s cubic-bezier(0.16,1,0.3,1) 0.15s",
          }}
        >
          <Image src="/images/men.jpg" alt="Taylor Vade Man" fill priority
            className="object-cover object-top" sizes="50vw" />
        </Link>
      </div>

      {/* ── Bottom black gradient ── */}
      <div
        className="absolute left-0 bottom-0 w-full pointer-events-none z-10"
        style={{
          height: "48%",
          background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0) 100%)",
          opacity: mounted ? 1 : 0,
          transition: "opacity 1.2s ease 0.5s",
        }}
      />

      {/* ── Copy ── */}
      <div className="absolute z-20 right-5 md:right-12 bottom-[11vh] md:bottom-[9vh] text-right pointer-events-none">
        <div style={{ overflow: "hidden" }}>
          <p
            className="text-white leading-[1.08]"
            style={{
              fontFamily: "var(--font-script), cursive",
              fontSize:   "clamp(38px, 6vw, 74px)",
              transform:  mounted ? "translateY(0)" : "translateY(110%)",
              transition: "transform 1.1s cubic-bezier(0.16,1,0.3,1) 0.55s",
            }}
          >
            Designed for
          </p>
        </div>
        <div style={{ overflow: "hidden" }}>
          <p
            className="text-white leading-[1.08]"
            style={{
              fontFamily: "var(--font-script), cursive",
              fontSize:   "clamp(38px, 6vw, 74px)",
              transform:  mounted ? "translateY(0)" : "translateY(110%)",
              transition: "transform 1.1s cubic-bezier(0.16,1,0.3,1) 0.7s",
            }}
          >
            the Discerning
          </p>
        </div>

        <div
          className="flex items-center justify-end gap-7 mt-5 pointer-events-auto"
          style={{
            opacity:    mounted ? 1 : 0,
            transform:  mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.9s ease 1.05s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 1.05s",
          }}
        >
          <Link href="/collections/woman"
            className="text-[13.5px] md:text-[14.5px] tracking-[0.14em] uppercase font-serif text-white
              border-b border-white/60 pb-1 hover:border-white transition-colors duration-300">
            Shop Woman
          </Link>
          <Link href="/collections/man"
            className="text-[13.5px] md:text-[14.5px] tracking-[0.14em] uppercase font-serif text-white
              border-b border-white/60 pb-1 hover:border-white transition-colors duration-300">
            Shop Man
          </Link>
        </div>
      </div>
    </section>
  );
}