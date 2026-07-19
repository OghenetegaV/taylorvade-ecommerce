import type { Metadata } from "next";
import "@/app/globals.css";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import Header from "@/components/layout/Header"; 

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
  metadataBase: new URL("https://taylorvade.com"), // Replace with your actual domain
  title: {
    default: "Taylor Vade | Luxury Handmade Leather Goods",
    template: "%s | Taylor Vade",
  },
  description: "Handcrafted leather shoes, bags, and bespoke accessories from Lagos. Designed for the discerning.",
  openGraph: {
    title: "Taylor Vade | Luxury Handmade Leather",
    description: "Handcrafted leather shoes, bags, and bespoke accessories from Lagos. Designed for the discerning.",
    url: "https://taylorvade.com",
    siteName: "Taylor Vade",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Taylor Vade Logo",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Taylor Vade | Luxury Handmade Leather",
    description: "Handcrafted leather shoes, bags, and bespoke accessories from Lagos. Designed for the discerning.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${cormorant.variable} ${greatVibes.variable} antialiased`}
      >
        <Header /> 
        {children}
        <ConditionalFooter />
      </body>
    </html>
  );
}