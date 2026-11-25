// src/app/launch/page.tsx
// Shareable New Collection launch page — taylorvade.com/launch.
// Same design as the site-wide popup, always shown; closing it goes to the homepage.

import type { Metadata } from "next";
import LaunchPopup from "@/components/layout/LaunchPopup";

export const metadata: Metadata = {
  title: "The New Collection — Dropping December",
  description: "The new Taylor Vade collection drops in December. Sign up for early access and 30% off your order.",
};

export default function LaunchPage() {
  return (
    <main className="min-h-svh bg-[#0b0908]">
      <LaunchPopup standalone />
    </main>
  );
}
