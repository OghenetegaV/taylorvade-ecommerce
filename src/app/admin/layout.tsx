// src/app/layout.tsx
// CHANGE: added GoogleAnalytics (only renders when NEXT_PUBLIC_GA_ID is set)

import type { Metadata } from "next";
import "../globals.css";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import ConditionalFooter from "@/components/layout/ConditionalFooter";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["300", "400", "500", "600", "700"],
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-script",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Taylor Vade",
  description: "Designed for the Discerning — Taylor Vade Lagos.",
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${cormorant.variable} ${greatVibes.variable} antialiased`}
      >
        {children}
        <ConditionalFooter />
      </body>
      {/* Loads gtag.js after hydration, off the critical path */}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
