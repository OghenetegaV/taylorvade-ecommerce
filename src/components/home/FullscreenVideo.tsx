"use client";

import { useEffect, useRef } from "react";

export default function FullscreenVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Attempt to force play on mount
    const v = videoRef.current;
    if (v) {
      v.play().catch((err) => {
        console.error("Autoplay prevented by browser:", err);
      });
    }
  }, []);

  return (
    <section className="w-full h-svh bg-black overflow-hidden relative">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        poster="/videos/campaign-poster.jpg"
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        preload="auto"
      >
        {/* Apple's official H.264 test file - Known to work on all iOS versions */}
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </section>
  );
}