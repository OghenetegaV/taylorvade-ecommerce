// src/components/home/LineReveal.tsx
// Masked line reveal: each child line rises out of an overflow-hidden mask,
// staggered. The editorial-headline animation.

"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  lines:      React.ReactNode[];
  stagger?:   number;  // ms between lines
  duration?:  number;
  delay?:     number;
  className?: string;
  lineClassName?: string;
};

export default function LineReveal({
  lines, stagger = 130, duration = 1000, delay = 0,
  className = "", lineClassName = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {lines.map((line, i) => (
        <div key={i} style={{ overflow: "hidden" }}>
          <div
            className={lineClassName}
            style={reduced ? undefined : {
              transform:  visible ? "translateY(0)" : "translateY(110%)",
              transition: `transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay + i * stagger}ms`,
              willChange: "transform",
            }}
          >
            {line}
          </div>
        </div>
      ))}
    </div>
  );
}
