// src/components/home/HeroSection.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const slides = [
  { src: "/images/women.jpg", alt: "Taylor Vade Woman", href: "/collections/woman" },
  { src: "/images/men.jpg",   alt: "Taylor Vade Man",   href: "/collections/man"   },
];

export default function HeroSection() {
  const [current,  setCurrent]  = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [loaded,   setLoaded]   = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Small delay so CSS animations fire after first paint
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isMobile]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, 4000);
  };

  return (
    <>
      <style>{`
        /* ── Image reveals ─────────────────────────────────────────────
           Left image slides + zooms in from the top.
           Right image slides + zooms in from the bottom.
           clip-path creates the cinematic wipe; scale adds the zoom.
        ────────────────────────────────────────────────────────────── */
        @keyframes tvRevealTop {
          from {
            clip-path: inset(0 0 100% 0);
            transform: scale(1.1) translateY(-20px);
          }
          to {
            clip-path: inset(0 0 0% 0);
            transform: scale(1) translateY(0);
          }
        }
        @keyframes tvRevealBottom {
          from {
            clip-path: inset(100% 0 0 0);
            transform: scale(1.1) translateY(20px);
          }
          to {
            clip-path: inset(0% 0 0 0);
            transform: scale(1) translateY(0);
          }
        }

        /* ── Text + links ──────────────────────────────────────────── */
        @keyframes tvFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tvFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Mobile: simple fade in for carousel */
        @keyframes tvFadeMobile {
          from { opacity: 0; transform: scale(1.04); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ── Animation classes ─────────────────────────────────────── */
        .tv-reveal-top {
          animation: tvRevealTop 1.4s cubic-bezier(0.77, 0, 0.175, 1) 0.1s both;
        }
        .tv-reveal-bottom {
          animation: tvRevealBottom 1.4s cubic-bezier(0.77, 0, 0.175, 1) 0.1s both;
        }
        .tv-fade-mobile {
          animation: tvFadeMobile 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s both;
        }
        .tv-text-1 {
          opacity: 0;
          animation: tvFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both;
        }
        .tv-text-2 {
          opacity: 0;
          animation: tvFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 1.1s both;
        }
        .tv-links {
          opacity: 0;
          animation: tvFadeIn 0.9s ease 1.4s both;
        }
      `}</style>

      {/* Section: 120vh — image extends below the fold */}
      <section className="relative w-full overflow-hidden" style={{ height: "120vh" }}>

        {/* ── DESKTOP: two clickable image panels ───────────────────── */}
        <div className="hidden md:flex h-full w-full">
          {/* Left — women — reveals from the TOP */}
          <Link
            href="/collections/woman"
            className={`relative flex-1 h-full overflow-hidden group block
              ${loaded ? "tv-reveal-top" : "opacity-0"}`}
          >
            <Image
              src="/images/women.jpg"
              alt="Taylor Vade Woman"
              fill priority
              className="object-cover object-top"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.05]
              transition-colors duration-500" />
          </Link>

          {/* Right — men — reveals from the BOTTOM */}
          <Link
            href="/collections/man"
            className={`relative flex-1 h-full overflow-hidden group block
              ${loaded ? "tv-reveal-bottom" : "opacity-0"}`}
          >
            <Image
              src="/images/men.jpg"
              alt="Taylor Vade Man"
              fill priority
              className="object-cover object-top"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.05]
              transition-colors duration-500" />
          </Link>
        </div>

        {/* ── MOBILE: carousel with fade-in ─────────────────────────── */}
        <div className="md:hidden relative h-full w-full overflow-hidden">
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{
              width: `${slides.length * 100}%`,
              transform: `translateX(-${(current * 100) / slides.length}%)`,
            }}
          >
            {slides.map((s, i) => (
              <Link
                key={i}
                href={s.href}
                className={`relative h-full flex-shrink-0 block
                  ${loaded && i === 0 ? "tv-fade-mobile" : ""}`}
                style={{ width: `${100 / slides.length}%` }}
              >
                <Image
                  src={s.src} alt={s.alt} fill priority={i === 0}
                  className="object-cover object-top"
                  sizes="100vw"
                />
              </Link>
            ))}
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-[22vh] left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  current === i ? "w-5 h-[3px] bg-white" : "w-[3px] h-[3px] bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>

        {/*
          ── Text + shop links ─────────────────────────────────────────
          bottom: 20vh  →  container bottom is at (120vh − 20vh) = 100vh
          from the section top, which is exactly the 100vh viewport line.
          The shop links sit at the very bottom of this container,
          so their underlines land precisely on the 100vh line.
          Text sits above them within the same wrapper.
        ──────────────────────────────────────────────────────────────── */}
        <div
          className="absolute right-6 md:right-10 z-20 text-right"
          style={{ bottom: "20vh" }}
        >
          {/* Script text — staggered fade-up */}
          <p
            className={loaded ? "tv-text-1" : "opacity-0"}
            style={{
              fontFamily: "var(--font-script), cursive",
              color: "white",
              lineHeight: 1.1,
              fontSize: "clamp(32px, 5vw, 52px)",
            }}
          >
            Spring Summer &apos;26
          </p>
          <p
            className={loaded ? "tv-text-2" : "opacity-0"}
            style={{
              fontFamily: "var(--font-script), cursive",
              color: "white",
              lineHeight: 1.1,
              fontSize: "clamp(32px, 5vw, 52px)",
            }}
          >
            Chapter Two
          </p>

          {/* Shop links — bottom of this container = 100vh line */}
          <div className={`flex gap-6 justify-end mt-3 ${loaded ? "tv-links" : "opacity-0"}`}>
            <Link
              href="/collections/woman"
              className="text-white text-[13px] md:text-[15px] tracking-[0.12em]
                font-semibold underline underline-offset-4
                hover:opacity-60 transition-opacity font-serif"
            >
              Shop Woman
            </Link>
            <Link
              href="/collections/man"
              className="text-white text-[13px] md:text-[15px] tracking-[0.12em]
                font-semibold underline underline-offset-4
                hover:opacity-60 transition-opacity font-serif"
            >
              Shop Man
            </Link>
          </div>
        </div>

      </section>
    </>
  );
}
