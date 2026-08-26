"use client";

import { useState } from "react";

const BRAND_LINKS = [
  { text: "Our Story", href: "#" },
  { text: "The Journal", href: "#" },
  { text: "Sustainability", href: "#" },
];

const CUSTOMER_LINKS = [
  { text: "Size Guide", href: "/size-guide" },
  { text: "Shipping & Deliveries", href: "/shipping-policy" },
  { text: "Returns & Exchanges", href: "/returns" },
  { text: "Secure Payments", href: "#" },
];

const LEGAL_LINKS = [
  { text: "Privacy Policy", href: "/privacy" },
  { text: "Terms & Conditions", href: "/terms" },
  { text: "Cookie Settings", href: "/cookies" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [preference, setPreference] = useState("all");
  const [cookieVisible, setCookieVisible] = useState(true);

  return (
    <footer className="bg-[#FAF9F7] text-[#1A1A18] font-sans antialiased text-[11px] tracking-wide border-t border-[#E5E5E0]">

      {/* Modern Asymmetrical Layout */}
      <div className="max-w-[1600px] mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
        {/* Left Side: Newsletter & Brand Brief (Takes 5 Columns) */}
        <div className="lg:col-span-5 flex flex-col space-y-8">
          <div className="space-y-2">
            <p className="text-[13px] font-bold uppercase tracking-[0.25em] text-[#1A1A18]">Join the Discerning</p>
            <p className="text-[#575754] font-serif italic text-[13px] max-w-md leading-relaxed">
              Sign up for private access to upcoming capsule drops, seasonal collections, and brand updates.
            </p>
          </div>
          
          <div className="space-y-4 max-w-md">
            <div className="relative w-full border-b border-[#B5B5B0] focus-within:border-[#1A1A18] transition-colors duration-300">
              <input
                type="email"
                placeholder="ENTER YOUR EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent py-3 pr-20 uppercase tracking-[0.1em] text-[#1A1A18] outline-none placeholder:text-[#A3A3A0]"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-[#1A1A18] font-bold tracking-[0.1em] hover:text-[#575754] transition-colors">
                SUBMIT →
              </button>
            </div>

            <div className="flex items-center gap-6 text-[#575754]">
              {(["woman", "man", "all"] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none uppercase text-[10px] tracking-wider hover:text-[#1A1A18] transition-colors">
                  <input
                    type="radio"
                    name="newsletter-pref"
                    checked={preference === key}
                    onChange={() => setPreference(key)}
                    className="w-3.5 h-3.5 accent-[#1A1A18] cursor-pointer bg-transparent border-[#B5B5B0]"
                  />
                  {key}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Navigation Links & Badges (Takes 7 Columns) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-6 w-full">
          {/* Column 1: Brand */}
          <div className="flex flex-col space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A18]">The Brand</p>
            <nav className="flex flex-col space-y-3 text-[#575754]">
              {BRAND_LINKS.map((link) => (
                <a key={link.text} href={link.href} className="hover:text-[#1A1A18] transition-colors">
                  {link.text}
                </a>
              ))}
            </nav>
          </div>

          {/* Column 2: Client Services */}
          <div className="flex flex-col space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A18]">Services</p>
            <nav className="flex flex-col space-y-3 text-[#575754]">
              {CUSTOMER_LINKS.map((link) => (
                <a key={link.text} href={link.href} className="hover:text-[#1A1A18] transition-colors">
                  {link.text}
                </a>
              ))}
            </nav>
          </div>

          {/* Column 3: Legal & Social Panel */}
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A18]">Legal</p>
              <nav className="flex flex-col space-y-3 text-[#575754]">
                {LEGAL_LINKS.map((link) => (
                  <a key={link.text} href={link.href} className="hover:text-[#1A1A18] transition-colors">
                    {link.text}
                  </a>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4 text-[#575754] pt-2">
              <a href="https://www.instagram.com/taylor_vade/" target="_blank" rel="noopener noreferrer" className="hover:text-[#1A1A18] transition-colors"><InstagramIcon /></a>
              <a href="#" className="hover:text-[#1A1A18] transition-colors"><FacebookIcon /></a>
              <a href="#" className="hover:text-[#1A1A18] transition-colors"><XIcon /></a>
              <a href="#" className="hover:text-[#1A1A18] transition-colors"><TikTokIcon /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Global Announcement Bar */}
      <div>
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E5E5E0] text-center text-[10px] uppercase tracking-[0.15em] text-[#575754]">
          {[
            "Complimentary Global Shipping",
            "Premium Express Worldwide",
            "Hassle-Free Returns",
            "Secure International Checkouts",
          ].map((text, i) => (
            <div key={i} className="py-4 px-4 truncate">
              {text}
            </div>
          ))}
        </div>
      </div>

      
      {/* Bottom Legal Metadata & Gateway List */}
      <div className="border-t border-[#E5E5E0] bg-[#F0EFEA] text-[#737370] text-[10px]">
        <div className="max-w-[1600px] mx-auto px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
            <p>© {new Date().getFullYear()} TAYLOR VADE. ALL RIGHTS RESERVED.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-[#1A1A18] transition-colors">ACCESSIBILITY</a>
              <a href="#" className="hover:text-[#1A1A18] transition-colors">SECURITY</a>
            </div>
          </div>

          {/* Gateways Display */}
          <div className="flex flex-wrap gap-2 items-center opacity-80 hover:opacity-100 transition-opacity duration-300">
            {["VISA", "PAYSTACK", "APPLE PAY", "GOOGLE PAY"].map((gateway) => (
              <div key={gateway} className="border border-[#E5E5E0] bg-[#FAF9F7] px-2 py-1 text-[8px] font-bold tracking-[0.1em] text-[#1A1A18] rounded-sm shadow-xs">
                {gateway}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Fixed Banner for Cookie Preference */}
      {cookieVisible && (
        <div className="fixed bottom-6 right-6 max-w-sm border border-[#E5E5E0] bg-[#FAF9F7] p-5 text-[#575754] rounded shadow-2xl z-50 flex flex-col gap-4">
          <p className="leading-relaxed">We utilize secure cookies to personalize your transaction pathways, regional parameters, and browsing choices.</p>
          <div className="flex gap-2 justify-end text-[10px] font-bold tracking-wider">
            <button onClick={() => setCookieVisible(false)} className="bg-[#1A1A18] text-white px-4 py-2 uppercase hover:bg-[#575754] transition-colors">ACCEPT</button>
            <button onClick={() => setCookieVisible(false)} className="border border-[#B5B5B0] text-[#1A1A18] px-4 py-2 uppercase hover:bg-black/5 transition-colors">DECLINE</button>
          </div>
        </div>
      )}
    </footer>
  );
}

/* --- Inline Minimal Social SVGs --- */
const InstagramIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
const FacebookIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const XIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.857L1.254 2.25H8.08l4.259 5.631 5.905-5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const TikTokIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z"/></svg>;