"use client";

import { useState } from "react";

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.857L1.254 2.25H8.08l4.259 5.631 5.905-5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z"/>
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const QRCode = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* Top-left finder */}
    {[0,1,2,3,4,5,6].flatMap(r => [0,1,2,3,4,5,6].map(c => {
      const p = [[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,0,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]];
      return p[r][c] ? <rect key={`tl-${r}-${c}`} x={c*6+2} y={r*6+2} width="5" height="5" fill="#1a1008"/> : null;
    }))}
    {/* Top-right finder */}
    {[0,1,2,3,4,5,6].flatMap(r => [0,1,2,3,4,5,6].map(c => {
      const p = [[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,0,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]];
      return p[r][c] ? <rect key={`tr-${r}-${c}`} x={(c+12)*6+2} y={r*6+2} width="5" height="5" fill="#1a1008"/> : null;
    }))}
    {/* Bottom-left finder */}
    {[0,1,2,3,4,5,6].flatMap(r => [0,1,2,3,4,5,6].map(c => {
      const p = [[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,0,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]];
      return p[r][c] ? <rect key={`bl-${r}-${c}`} x={c*6+2} y={(r+12)*6+2} width="5" height="5" fill="#1a1008"/> : null;
    }))}
    {/* Data pattern */}
    {[[8,8],[8,10],[8,12],[9,9],[9,11],[10,8],[10,12],[11,10],[8,2],[8,4],[9,3],[10,2],[10,4],[2,8],[4,8],[3,9],[2,10],[4,10]].map(([r,c],i) => (
      <rect key={`d${i}`} x={c*6+2} y={r*6+2} width="5" height="5" fill="#1a1008"/>
    ))}
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState("");
  const [checked, setChecked] = useState({ woman: true, man: false, all: false });
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [cookieVisible, setCookieVisible] = useState(true);

  const toggle = (section: string) =>
    setOpenSection(openSection === section ? null : section);

  const handleCheck = (key: "woman" | "man" | "all") =>
    setChecked({ woman: false, man: false, all: false, [key]: true });

  return (
    <footer className="bg-[#FAF9F7] text-[#1a1008] font-serif">

      {/* Shipping Bar */}
      <div className="border-t border-b border-[#ddd8d0]">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            "Free Delivery Over £150*",
            "UK Next Day Delivery",
            "Free In-Store Returns",
            "£2.99 Fixed-Fee UK Postal Returns",
          ].map((text, i) => (
            <div
              key={i}
              className="text-center py-6 px-3 md:px-5 text-[11px] tracking-wide leading-relaxed"
            >
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Social Icons */}
      <div className="flex justify-center gap-4 py-10">
        {[InstagramIcon, FacebookIcon, XIcon, TikTokIcon].map((Icon, i) => (
          <a
            key={i}
            href="#"
            className="w-11 h-11 rounded-full bg-[#1a1008] text-[#f7f3ef] flex items-center justify-center hover:opacity-70 transition-opacity"
          >
            <Icon />
          </a>
        ))}
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 pb-14 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 items-start">

        {/* Newsletter */}
        <div>
          <p className="text-sm tracking-widest mb-5 font-normal">Sign up to Our Newsletter</p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-transparent border-b border-[#1a1008] py-2 text-xs tracking-wide outline-none placeholder:text-[#9a8a7a] mb-5 font-serif"
          />

          <div className="flex items-center gap-5 mb-6">
            {(["woman", "man", "all"] as const).map(key => (
              <label
                key={key}
                className="flex items-center gap-2 text-xs tracking-wider cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked[key]}
                  onChange={() => handleCheck(key)}
                  className="w-4 h-4 accent-[#1a1008] cursor-pointer"
                />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
            ))}
          </div>

          <button className="border border-[#1a1008] px-8 py-2.5 text-xs tracking-[0.15em] hover:bg-[#1a1008] hover:text-[#f7f3ef] transition-colors duration-200 font-serif">
            Subscribe
          </button>
        </div>

        {/* About Links */}
        <div>
          <p className="text-sm tracking-widest mb-5 font-normal">About Us</p>

          {[
            { label: "Taylor Vade", key: "brand", links: ["About Taylor Vade", "Our Stores", "TV Rewards", "Careers"] },
            { label: "Help & Info", key: "help", links: ["Size Guide", "Delivery & Returns", "Payments", "Privacy Policy", "Terms & Conditions"] },
          ].map(({ label, key, links }) => (
            <div key={key} className="border-b border-[#ddd8d0]">
              <button
                onClick={() => toggle(key)}
                className="w-full flex justify-between items-center py-3.5 text-xs tracking-wider bg-transparent border-none cursor-pointer text-[#1a1008] font-serif"
              >
                {label}
                <ChevronIcon open={openSection === key} />
              </button>
              {openSection === key && (
                <div className="pb-3 text-[11px] text-[#6a5a4a] leading-loose tracking-wide">
                  {links.map(link => (
                    <a key={link} href="#" className="block hover:text-[#1a1008] transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          <a
            href="#"
            className="block py-3.5 text-xs tracking-wider border-b border-[#ddd8d0] hover:opacity-60 transition-opacity"
          >
            Contact Us
          </a>
        </div>

        {/* QR + Payments */}
        <div className="flex flex-col items-start md:items-end gap-5">
          <div className="w-24 h-24 border border-[#ddd8d0] bg-white p-1">
            <QRCode />
          </div>

          <div className="flex flex-wrap gap-1.5 justify-start md:justify-end">
            {["VISA", "MC", "Maestro", "AMEX", "Klarna", "₿", "Nordea"].map((p) => (
              <div
                key={p}
                className="border border-[#ddd8d0] rounded-sm px-2 py-1 text-[9px] tracking-wide bg-white font-semibold min-w-[36px] text-center"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cookie Notice */}
      {cookieVisible && (
        <div className="border-t border-[#ddd8d0] py-4 px-6 text-center text-[11px] tracking-wide text-[#6a5a4a]">
          Taylor Vade uses cookies to improve your shopping experience.{" "}
          <a
            href="#"
            onClick={e => { e.preventDefault(); setCookieVisible(false); }}
            className="text-[#1a1008] underline hover:opacity-60"
          >
            Accept
          </a>
          {" "}or{" "}
          <a
            href="#"
            onClick={e => { e.preventDefault(); setCookieVisible(false); }}
            className="text-[#1a1008] underline hover:opacity-60"
          >
            Decline
          </a>
        </div>
      )}
    </footer>
  );
}