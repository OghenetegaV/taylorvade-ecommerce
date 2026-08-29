"use client";

import { useState } from "react";
import { InstagramIcon, FacebookIcon, XIcon, TikTokIcon } from "@/components/icons/SocialIcons";

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
    <footer className="bg-[#FAF9F7] text-[#1A1A18] font-sans antialiased text-[12.5px] tracking-wide border-t border-[#E5E5E0]">

      {/* Modern Asymmetrical Layout */}
      <div className="max-w-[1600px] mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
        {/* Left Side: Newsletter & Brand Brief (Takes 5 Columns) */}
        <div className="lg:col-span-5 flex flex-col space-y-8">
          <div className="space-y-2">
            <p className="text-[14.5px] font-bold uppercase tracking-[0.25em] text-[#1A1A18]">Join the Discerning</p>
            <p className="text-[#575754] font-serif italic text-[14.5px] max-w-md leading-relaxed">
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
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none uppercase text-[11.5px] tracking-wider hover:text-[#1A1A18] transition-colors">
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
            <p className="text-[11.5px] font-bold uppercase tracking-[0.2em] text-[#1A1A18]">The Brand</p>
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
            <p className="text-[11.5px] font-bold uppercase tracking-[0.2em] text-[#1A1A18]">Services</p>
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
              <p className="text-[11.5px] font-bold uppercase tracking-[0.2em] text-[#1A1A18]">Legal</p>
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
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E5E5E0] text-center text-[11.5px] uppercase tracking-[0.15em] text-[#575754]">
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
      <div className="border-t border-[#E5E5E0] bg-[#F0EFEA] text-[#737370] text-[11.5px]">
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
              <div key={gateway} className="border border-[#E5E5E0] bg-[#FAF9F7] px-2 py-1 text-[9.5px] font-bold tracking-[0.1em] text-[#1A1A18] rounded-sm shadow-xs">
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
          <div className="flex gap-2 justify-end text-[11.5px] font-bold tracking-wider">
            <button onClick={() => setCookieVisible(false)} className="bg-[#1A1A18] text-white px-4 py-2 uppercase hover:bg-[#575754] transition-colors">ACCEPT</button>
            <button onClick={() => setCookieVisible(false)} className="border border-[#B5B5B0] text-[#1A1A18] px-4 py-2 uppercase hover:bg-black/5 transition-colors">DECLINE</button>
          </div>
        </div>
      )}
    </footer>
  );
}

