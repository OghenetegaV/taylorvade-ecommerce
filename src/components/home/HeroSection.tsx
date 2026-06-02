"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const slides = [
  { src: "/images/women.jpg", alt: "Taylor Vade Woman" },
  { src: "/images/men.jpg",   alt: "Taylor Vade Man" },
];

export default function HeroSection() {
  const [current, setCurrent]   = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  /* detect mobile */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* auto-advance on mobile */
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
    <section className="relative w-full h-screen overflow-hidden">

      {/* ── DESKTOP: two images side by side ── */}
      <div className="hidden md:flex h-full w-full">
        {slides.map((s, i) => (
          <div key={i} className="relative flex-1 h-full overflow-hidden">
            <Image
              src={s.src}
              alt={s.alt}
              fill
              priority={i === 0}
              className="object-cover object-top"
              sizes="50vw"
            />
          </div>
        ))}
      </div>

      {/* ── MOBILE: sliding carousel ── */}
      <div className="md:hidden relative h-full w-full overflow-hidden">
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ width: `${slides.length * 100}%`, transform: `translateX(-${(current * 100) / slides.length}%)` }}
        >
          {slides.map((s, i) => (
            <div key={i} className="relative h-full flex-shrink-0" style={{ width: `${100 / slides.length}%` }}>
              <Image
                src={s.src}
                alt={s.alt}
                fill
                priority={i === 0}
                className="object-cover object-top"
                sizes="100vw"
              />
            </div>
          ))}
        </div>

        {/* Dot indicators — mobile only */}
        <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                current === i
                  ? "w-5 h-[3px] bg-white"
                  : "w-[3px] h-[3px] bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Overlay text — bottom right, same on both breakpoints ── */}
      <div className="absolute bottom-18 right-6 md:right-10 z-20 text-right pointer-events-none">
        <p
          className="text-white leading-[1.1] text-[36px] md:text-[52px]"
          style={{ fontFamily: "var(--font-script), cursive" }}
        >
          Spring Summer &apos;26
        </p>
        <p
          className="text-white leading-[1.1] text-[36px] md:text-[52px]"
          style={{ fontFamily: "var(--font-script), cursive" }}
        >
          Chapter Two
        </p>
      </div>

      {/* ── Shop links — bottom right, above text ── */}
      <div className="absolute bottom-10 right-6 md:right-10 z-20 flex gap-6">
        <Link
          href="/collections/woman"
          className="text-white text-[16px] tracking-[0.15em] font-bold underline underline-offset-4
            hover:opacity-60 transition-opacity font-serif"
        >
          Shop Woman
        </Link>
        <Link
          href="/collections/man"
          className="text-white text-[16px] tracking-[0.15em] font-bold underline underline-offset-4
            hover:opacity-60 transition-opacity font-serif"
        >
          Shop Man
        </Link>
      </div>

    </section>
  );
}