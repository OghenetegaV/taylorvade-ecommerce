// src/components/home/ScrollReveal.tsx
// On-view reveal wrapper with variants. IntersectionObserver + CSS only.
//   fade-up  — rises and fades in (default)
//   fade     — opacity only
//   clip-up  — cinematic wipe from bottom (for images/video panels)
//   clip-down— wipe from top
//   scale    — settles from 1.06 to 1 while fading
// Respects prefers-reduced-motion (content simply appears).

"use client";

import { useEffect, useRef, useState } from "react";

type Variant = "fade-up" | "fade" | "clip-up" | "clip-down" | "scale";

type Props = {
  children:   React.ReactNode;
  variant?:   Variant;
  delay?:     number;   // ms
  duration?:  number;   // ms
  distance?:  number;   // px, for fade-up
  once?:      boolean;
  className?: string;
  style?:     React.CSSProperties;
};

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function ScrollReveal({
  children, variant = "fade-up", delay = 0, duration = 900,
  distance = 30, once = true, className = "", style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) obs.disconnect();
        } else if (!once) setVisible(false);
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [once]);

  if (reduced) return <div className={className} style={style}>{children}</div>;

  const base: React.CSSProperties = {
    transition: `opacity ${duration}ms ${EASE} ${delay}ms,
                 transform ${duration}ms ${EASE} ${delay}ms,
                 clip-path ${duration + 200}ms ${EASE} ${delay}ms`,
    willChange: "opacity, transform, clip-path",
  };

  const hidden: Record<Variant, React.CSSProperties> = {
    "fade-up":   { opacity: 0, transform: `translateY(${distance}px)` },
    "fade":      { opacity: 0 },
    "clip-up":   { clipPath: "inset(100% 0 0 0)", transform: "scale(1.06)" },
    "clip-down": { clipPath: "inset(0 0 100% 0)", transform: "scale(1.06)" },
    "scale":     { opacity: 0, transform: "scale(1.05)" },
  };
  const shown: Record<Variant, React.CSSProperties> = {
    "fade-up":   { opacity: 1, transform: "translateY(0)" },
    "fade":      { opacity: 1 },
    "clip-up":   { clipPath: "inset(0% 0 0 0)", transform: "scale(1)" },
    "clip-down": { clipPath: "inset(0 0 0% 0)", transform: "scale(1)" },
    "scale":     { opacity: 1, transform: "scale(1)" },
  };

  return (
    <div ref={ref} className={className}
      style={{ ...style, ...base, ...(visible ? shown[variant] : hidden[variant]) }}>
      {children}
    </div>
  );
}
