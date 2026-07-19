"use client";

import { useEffect, useRef } from "react";

export default function FullscreenVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    
    // Attempt autoplay immediately
    const playVideo = () => {
      video?.play().catch(() => {
        // Autoplay failed; we wait for user interaction
      });
    };

    playVideo();

    // The iOS "Secret" fix: Add a touch listener to the window
    const handleInteraction = () => {
      playVideo();
      // Remove listener once triggered so it only happens once
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("click", handleInteraction);
    };

    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("click", handleInteraction);

    return () => {
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("click", handleInteraction);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover"
      poster="/videos/campaign-poster.jpg"
      autoPlay
      muted
      playsInline
      preload="auto"
    >
      <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
    </video>
  );
}