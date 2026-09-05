"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { InstagramIcon, FacebookIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons/SocialIcons";
import { VisaIcon, MastercardIcon, ApplePayIcon, PaystackIcon } from "@/components/icons/PaymentIcons";
import { getCookieConsent, setCookieConsent } from "@/lib/cookieConsent";

const BRAND_LINKS = [
  { text: "About Us", href: "/about" },
];

const WHATSAPP_NUMBER = "2349030305584";

const SOCIALS = [
  { Icon: WhatsAppIcon,  href: `https://wa.me/${WHATSAPP_NUMBER}` },
  { Icon: InstagramIcon, href: "https://www.instagram.com/taylor_vade/" },
  { Icon: TikTokIcon,    href: "https://www.tiktok.com/@taylorvade" },
  { Icon: FacebookIcon,  href: "https://www.facebook.com/taylorvade" },
];

const PAYMENT_METHODS = [
  { Icon: PaystackIcon,    label: "Paystack" },
  { Icon: ApplePayIcon,    label: "Apple Pay" },
  { Icon: VisaIcon,        label: "Visa" },
  { Icon: MastercardIcon,  label: "Mastercard" },
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
  const [preferences, setPreferences] = useState({ woman: true, man: false, all: false });
  const [cookieVisible, setCookieVisible] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Only show the banner if the shopper hasn't already made a choice —
  // previously this always started true and never persisted, so it
  // reappeared on every page load regardless of Accept/Decline.
  useEffect(() => {
    if (!getCookieConsent()) setCookieVisible(true);
  }, []);

  function handleCookieChoice(choice: "accepted" | "declined") {
    setCookieConsent(choice);
    setCookieVisible(false);
  }

  const togglePreference = (key: "woman" | "man" | "all") => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <footer className="bg-[#FAF9F7] text-[#1A1A18] font-serif antialiased border-t border-[#E5E5E0]">
        <div className="w-full border-b border-[#E5E5E0]">
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 text-center text-[12px] md:text-[13px] text-[#575754] tracking-wide py-4 gap-y-4">
            {[
              "Complimentary Global Shipping",
              "Premium Express Worldwide",
              "Hassle-Free Returns",
              "Secure International Checkouts",
            ].map((text, i) => (
              <div key={i} className="px-4">
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-6 py-8">
          {SOCIALS.map(({ Icon, href }, i) => (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-full bg-[#1A1A18] text-[#FAF9F7] flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <Icon className="w-5 h-5" />
            </a>
          ))}
        </div>

        <div className="max-w-[1600px] mx-auto px-8 pb-10 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-4 items-start">
          <div className="flex flex-col space-y-6">
            <h3 className="text-[15px] font-bold tracking-wide text-center md:text-left">Sign up to Our Newsletter</h3>
            
            <div className="space-y-4">
              <div className="w-full border-b border-[#1A1A18] pb-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#A3A3A0]"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 gap-6 sm:gap-0">
                <div className="flex items-center gap-6 text-[#575754]">
                  {(["woman", "man", "all"] as const).map((key) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer select-none text-[13px] capitalize">
                      <div
                        className={`w-4 h-4 border flex items-center justify-center ${
                          preferences[key] ? "bg-[#1A1A18] border-[#1A1A18]" : "border-[#B5B5B0]"
                        }`}
                        onClick={() => togglePreference(key)}
                      >
                        {preferences[key] && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {key}
                    </label>
                  ))}
                </div>
                <button className="w-full sm:w-auto border border-[#1A1A18] px-8 py-2.5 text-[13px] hover:bg-[#1A1A18] hover:text-[#FAF9F7] transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2 text-[14px] md:pl-16">
            <Link href="/about" className="hover:text-[#575754] transition-colors py-1">About Us</Link>
            
            {/* <details className="group cursor-pointer">
              <summary className="flex justify-between items-center hover:text-[#575754] transition-colors py-1 list-none">
                The Brand
                <span className="text-[14px] inline-block rotate-180 group-open:rotate-0 transition-transform duration-300">^</span>
              </summary>
              <div className="flex flex-col space-y-2 pt-2 pl-4 text-[#575754] text-[13px]">
                {BRAND_LINKS.map((link) => (
                  <a key={link.text} href={link.href} className="hover:text-[#1A1A18] transition-colors">{link.text}</a>
                ))}
              </div>
            </details> */}

            <details className="group cursor-pointer">
              <summary className="flex justify-between items-center hover:text-[#575754] transition-colors py-1 list-none">
                Services
                <span className="text-[14px] inline-block rotate-180 group-open:rotate-0 transition-transform duration-300">^</span>
              </summary>
              <div className="flex flex-col space-y-2 pt-2 pl-4 text-[#575754] text-[13px]">
                {CUSTOMER_LINKS.map((link) => (
                  <a key={link.text} href={link.href} className="hover:text-[#1A1A18] transition-colors">{link.text}</a>
                ))}
              </div>
            </details>

            <details className="group cursor-pointer">
              <summary className="flex justify-between items-center hover:text-[#575754] transition-colors py-1 list-none">
                Legal
                <span className="text-[14px] inline-block rotate-180 group-open:rotate-0 transition-transform duration-300">^</span>
              </summary>
              <div className="flex flex-col space-y-2 pt-2 pl-4 text-[#575754] text-[13px]">
                {LEGAL_LINKS.map((link) => (
                  <a key={link.text} href={link.href} className="hover:text-[#1A1A18] transition-colors">{link.text}</a>
                ))}
              </div>
            </details>

            <button 
              onClick={() => setIsContactOpen(true)} 
              className="text-left hover:text-[#575754] transition-colors py-1"
            >
              Contact Us
            </button>
          </div>

          <div className="flex flex-col items-center md:items-end justify-between h-full space-y-8 md:space-y-6">
            <div className="w-28 h-28 bg-white border border-[#E5E5E0] p-2 flex items-center justify-center">
              <div className="w-full h-full bg-[#1A1A18] text-white flex items-center justify-center text-[10px] text-center">
                QR CODE<br/>PLACEHOLDER
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-2 items-center">
              {PAYMENT_METHODS.map(({ Icon, label }) => (
                <Icon key={label} className="h-6 w-9" />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#E5E5E0] bg-[#F0EFEA] text-[#737370] text-[11px] font-sans">
          <div className="max-w-[1600px] mx-auto px-8 py-3 text-center">
            <p>© {new Date().getFullYear()} TAYLOR VADE. ALL RIGHTS RESERVED.</p>
          </div>
        </div>

        {cookieVisible && (
          <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm border border-[#E5E5E0] bg-[#FAF9F7] p-4 text-[#575754] rounded shadow-2xl z-40 flex flex-col gap-3 font-sans text-[12px]">
            <p className="leading-relaxed">We utilize secure cookies to personalize your transaction pathways, regional parameters, and browsing choices.</p>
            <div className="flex gap-2 justify-end text-[11px] font-bold tracking-wider">
              <button onClick={() => handleCookieChoice("accepted")} className="bg-[#1A1A18] text-white px-3 py-1.5 uppercase hover:bg-[#575754] transition-colors">ACCEPT</button>
              <button onClick={() => handleCookieChoice("declined")} className="border border-[#B5B5B0] text-[#1A1A18] px-3 py-1.5 uppercase hover:bg-black/5 transition-colors">DECLINE</button>
            </div>
          </div>
        )}
      </footer>

      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans text-[#1A1A18]">
          <div className="bg-[#FAF9F7] w-full max-w-md p-8 relative shadow-2xl border border-[#E5E5E0] animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsContactOpen(false)}
              className="absolute top-4 right-4 text-2xl leading-none hover:text-[#575754] transition-colors"
            >
              &times;
            </button>
            
            <h2 className="text-2xl font-serif mb-6 text-center">Contact Us</h2>
            
            <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-1">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  className="border-b border-[#B5B5B0] bg-transparent py-2 text-[13px] outline-none focus:border-[#1A1A18] transition-colors"
                  required
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  className="border-b border-[#B5B5B0] bg-transparent py-2 text-[13px] outline-none focus:border-[#1A1A18] transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <textarea 
                  placeholder="How can we help you?" 
                  rows={4}
                  className="border-b border-[#B5B5B0] bg-transparent py-2 text-[13px] outline-none focus:border-[#1A1A18] transition-colors resize-none"
                  required
                ></textarea>
              </div>

              <button 
                type="submit"
                className="mt-4 bg-[#1A1A18] text-white py-3 text-[12px] uppercase tracking-widest font-bold hover:bg-[#575754] transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}