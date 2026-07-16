// src/components/home/CampaignFilm.tsx
// Full-bleed campaign film — edge to edge, full viewport height.
// Plays muted in view, pauses offscreen. svh units so mobile browser chrome doesn't clip it.

"use client";

import { useEffect, useRef, useState } from "react";
import ScrollReveal from "./ScrollReveal";
import LineReveal from "./LineReveal";

const VolumeOn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a8.5 8.5 0 0 1 0 12"/>
  </svg>
);
const VolumeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/>
  </svg>
);

export default function CampaignFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.3) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: [0, 0.3, 1] }
    );
    obs.observe(video);
    return () => obs.disconnect();
  }, []);

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  return (
    <section className="relative w-full overflow-hidden bg-black"
      style={{ height: "100svh" }}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/campaign.mp4"
        poster="/videos/campaign-poster.jpg"
        muted loop playsInline preload="metadata"
      />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />

      {/* Copy — bottom left, staggered line reveals */}
      <div className="absolute left-5 md:left-12 bottom-8 md:bottom-14 pr-16">
        <ScrollReveal variant="fade" delay={100} duration={800}>
          <p className="text-[10px] tracking-[0.35em] uppercase font-serif text-white/70 mb-3">
            The Film — Chapter Two
          </p>
        </ScrollReveal>
        <LineReveal
          delay={250}
          lines={[
            <span key="l1" className="text-white leading-[1.05] block"
              style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(34px, 6vw, 68px)" }}>
              Lagos, in motion
            </span>,
          ]}
        />
        <ScrollReveal variant="fade-up" delay={550} distance={18}>
          <p className="text-white/80 text-[12px] md:text-[13px] font-serif tracking-[0.04em] leading-relaxed mt-3 max-w-[420px]">
            Shot between Surulere rooftops and studio floors — the collection,
            worn the way it was cut to be worn.
          </p>
        </ScrollReveal>
      </div>

      {/* Sound toggle */}
      <ScrollReveal variant="fade" delay={800} className="absolute right-5 md:right-10 bottom-8 md:bottom-14">
      <button
        onClick={toggleMute}
        aria-label={muted ? "Unmute film" : "Mute film"}
        className="w-10 h-10 rounded-full
          border border-white/50 text-white flex items-center justify-center
          hover:bg-white hover:text-[#1a1008] active:scale-95 transition-all duration-300"
      >
        {muted ? <VolumeOff /> : <VolumeOn />}
      </button>
      </ScrollReveal>
    </section>
  );
}
