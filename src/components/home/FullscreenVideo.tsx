"use client";

import { useEffect, useRef, useState } from "react";

export default function FullscreenVideo() {
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState(1);

  useEffect(() => {
    const v1 = videoRef1.current;
    const v2 = videoRef2.current;
    if (!v1 || !v2) return;

    const crossfadeDuration = 0.5;

    const handleTimeUpdate = (primary: HTMLVideoElement, secondary: HTMLVideoElement, targetActiveNum: number) => {
      if (primary.duration && primary.currentTime >= primary.duration - crossfadeDuration) {
        if (secondary.paused) {
          secondary.currentTime = 0;
          secondary.play().then(() => {
            setActiveVideo(targetActiveNum);
          }).catch(() => {});
        }
      }
    };

    const onTimeUpdate1 = () => handleTimeUpdate(v1, v2, 2);
    const onTimeUpdate2 = () => handleTimeUpdate(v2, v1, 1);

    v1.addEventListener("timeupdate", onTimeUpdate1);
    v2.addEventListener("timeupdate", onTimeUpdate2);

    return () => {
      v1.removeEventListener("timeupdate", onTimeUpdate1);
      v2.removeEventListener("timeupdate", onTimeUpdate2);
    };
  }, []);

  return (
    <section className="w-full h-svh bg-black overflow-hidden relative">
      <div className="w-full h-full relative">
        <video
          ref={videoRef1}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 block ${
            activeVideo === 1 ? "opacity-100 z-20 scale-100" : "opacity-5 z-10 scale-98 pointer-events-none"
          }`}
          src="/videos/video.mp4"
          poster="/videos/campaign-poster.jpg"
          autoPlay
          muted
          playsInline
        />
        <video
          ref={videoRef2}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 block ${
            activeVideo === 2 ? "opacity-100 z-20 scale-100" : "opacity-5 z-10 scale-98 pointer-events-none"
          }`}
          src="/videos/video.mp4"
          poster="/videos/campaign-poster.jpg"
          muted
          playsInline
        />
      </div>
    </section>
  );
}