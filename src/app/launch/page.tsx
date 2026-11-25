// src/app/launch/page.tsx
// Pre-launch holding page. While the site is private (src/lib/launch.ts) every
// store page redirects here; after launch src/proxy.ts sends /launch to "/".
//
// Behind the signup card sits the real homepage (header + hero), blurred,
// dimmed and inert — a glimpse of the site without letting anyone into it.

import type { Metadata } from "next";
import LaunchSignup from "./LaunchSignup";
import Header from "@/components/layout/Header";
import HeroSection from "@/components/home/HeroSection";
import { launchLabel } from "@/lib/launch";

export const metadata: Metadata = {
  title: "Something Worth Waiting For",
  description: "Taylor Vade launches 11 December. Join the early access list for 30% off your first order.",
};

export default function LaunchPage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[#0d0b0a]">
      {/* Blurred, non-interactive glimpse of the site */}
      <div
        aria-hidden
        inert
        className="fixed inset-0 pointer-events-none select-none overflow-hidden"
        style={{ filter: "blur(9px)", transform: "scale(1.06)" }}
      >
        <Header />
        <HeroSection />
      </div>
      <div aria-hidden className="fixed inset-0 bg-black/50" />

      <LaunchSignup launchLabel={launchLabel()} />
    </div>
  );
}
