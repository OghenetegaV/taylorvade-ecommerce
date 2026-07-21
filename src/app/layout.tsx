// src/app/layout.tsx
// CHANGES vs your current file:
//   1. Header → ConditionalHeader (hidden on /admin, auth pages, /checkout)
//   2. GoogleAnalytics added here (this is where it belongs, not admin/layout)
// Your full metadata block is preserved untouched.

import type { Metadata } from "next";
import "@/app/globals.css";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import ConditionalHeader from "@/components/layout/ConditionalHeader";
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
  metadataBase: new URL("https://taylorvade.com"),
  title: {
    default: "Taylor Vade Lagos | Designed for the Discerning",
    template: "%s | Taylor Vade Lagos",
  },
  description: "Luxury fashion brand based in Lagos. Tailored craftsmanship and artisanal quality. Designed for the Discerning.",
  openGraph: {
    title: "Taylor Vade Lagos | Designed for the Discerning",
    description: "Luxury fashion brand based in Lagos. Tailored craftsmanship and artisanal quality. Designed for the Discerning.",
    url: "https://taylorvade.com",
    siteName: "Taylor Vade",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Taylor Vade Lagos - Designed for the Discerning",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Taylor Vade Lagos | Designed for the Discerning",
    description: "Luxury fashion brand based in Lagos. Tailored craftsmanship and artisanal quality. Designed for the Discerning.",
    images: ["/logo.png"],
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${cormorant.variable} ${greatVibes.variable} antialiased`}
      >
        <ConditionalHeader />
        {children}
        <ConditionalFooter />
      </body>
      {/* Loads gtag.js after hydration, off the critical path */}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
