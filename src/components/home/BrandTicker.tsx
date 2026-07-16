// src/components/home/BrandTicker.tsx
// Infinite marquee strip. Pure CSS animation — pauses for reduced motion.

"use client";

const PHRASES = [
  "Designed for the Discerning",
  "Taylor Vade Lagos",
  "Black is Boring",
  "Cut Once. Worn Forever.",
  "Est. Lagos",
];

export default function BrandTicker() {
  const run = [...PHRASES, ...PHRASES, ...PHRASES]; // 3x for seamless loop

  return (
    <div className="bg-[#1a1008] overflow-hidden py-3 select-none" aria-hidden="true">
      <style>{`
        @keyframes tvTicker {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(-33.333%,0,0); }
        }
        .tv-ticker-track { animation: tvTicker 28s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .tv-ticker-track { animation: none; }
        }
      `}</style>
      <div className="tv-ticker-track flex items-center gap-8 whitespace-nowrap w-max">
        {run.map((phrase, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="text-[11px] md:text-[12px] tracking-[0.3em] uppercase font-serif text-[#F1EFE8]/85">
              {phrase}
            </span>
            <span className="text-[#c45a2a] text-[10px]">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
