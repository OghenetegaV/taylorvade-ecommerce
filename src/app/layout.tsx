import type { Metadata } from "next";
import "./globals.css";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
// 1. Import your Header component here (adjust the path if yours is named differently or located elsewhere)
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
  title: "Taylor Vade",
  description: "Luxury Fashion Ecommerce",
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