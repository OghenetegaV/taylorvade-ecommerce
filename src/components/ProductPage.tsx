"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export interface ProductPageProps {
  name: string;
  colorLabel: string;
  type: string;
  price: number;
  isNew?: boolean;
  images: string[];
  swatchImages?: { src: string; colorLabel: string }[];
  sizes?: string[];
  editorNotes?: string;
  sizeFit?: string;
  deliveryReturns?: string;
  shopTheLook?: { slug: string; image: string; name: string }[];
  selectedForYou?: { slug: string; image: string; name: string; description: string }[];
  orderDeadline?: { hrs: number; mins: number; date: string };
}

/* ── Icons ── */
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="17" height="17" viewBox="0 0 24 24"
    fill={filled ? "#1a1008" : "none"} stroke="#1a1008" strokeWidth="1.3"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
  </svg>
);

const EiffelIcon = () => (
  <svg width="22" height="34" viewBox="0 0 30 46" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <line x1="15" y1="0" x2="15" y2="3"/>
    <path d="M15 3 L11.5 11 L18.5 11 Z"/>
    <line x1="10.5" y1="13.5" x2="19.5" y2="13.5"/>
    <path d="M11.5 11 L7.5 21 L22.5 21 L18.5 11"/>
    <line x1="6.5" y1="24" x2="23.5" y2="24"/>
    <path d="M7.5 21 L3 36 L27 36 L22.5 21"/>
    <path d="M3 36 L1 44 L29 44 L27 36"/>
  </svg>
);

/* ── Accordion ── */
function Accordion({ label, content }: { label: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#e8e2db]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center py-4 text-[11.5px] tracking-[0.05em] text-[#1a1008] font-serif text-left"
      >
        {label}
        <span className={`transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
          <PlusIcon />
        </span>
      </button>
      {open && (
        <p className="pb-5 text-[11px] text-[#5a4a3a] font-serif leading-relaxed tracking-wide">
          {content}
        </p>
      )}
    </div>
  );
}

/* ── Countdown ── */
function useCountdown(hrs: number, mins: number) {
  const end = useRef(Date.now() + (hrs * 3600 + mins * 60) * 1000);
  const [t, setT] = useState({ hrs, mins });
  useEffect(() => {
    const iv = setInterval(() => {
      const d = Math.max(0, end.current - Date.now());
      setT({ hrs: Math.floor(d / 3600000), mins: Math.floor((d % 3600000) / 60000) });
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  return t;
}

export default function ProductPage({
  name,
  colorLabel,
  type,
  price,
  isNew = false,
  images = [],
  swatchImages = [],
  sizes = [],
  editorNotes = "A beautifully crafted piece with attention to every detail. Elevated essentials for the modern wardrobe.",
  sizeFit = "Model wears a size M. We recommend sizing true to size for a regular fit.",
  deliveryReturns = "Free UK delivery on orders over £150. Free in-store returns. Postal returns £2.99 within 28 days.",
  shopTheLook = [],
  selectedForYou = [],
  orderDeadline = { hrs: 13, mins: 46, date: "1 June" },
}: ProductPageProps) {
  const [activeImage,  setActiveImage]  = useState(0);
  const [activeSwatch, setActiveSwatch] = useState(0);
  const [activeSize,   setActiveSize]   = useState<string | null>(null);
  const [wished,       setWished]       = useState(false);
  const [mobileSlide,  setMobileSlide]  = useState(0);
  const countdown = useCountdown(orderDeadline.hrs, orderDeadline.mins);
  const pad = (n: number) => String(n).padStart(2, "0");

  const mainSrc = images[activeImage] ?? "/images/men.jpg";

  return (
    <div className="bg-white min-h-screen font-serif">

      {/* ══ DESKTOP: image left, details right ══ */}
      <div className="hidden md:flex min-h-screen">

        {/* LEFT — images */}
        <div className="w-[55%] flex flex-col">

          {/* Main image */}
          <div className="relative flex-1 bg-[#f0eeeb] min-h-[80vh]">
            <Image
              src={mainSrc}
              alt={name}
              fill
              priority
              className="object-cover object-top"
              sizes="55vw"
            />
          </div>

          {/* Thumbnail strip below main image */}
          {images.length > 1 && (
            <div className="flex gap-1 p-2 bg-white border-t border-[#e8e2db]">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className="relative flex-shrink-0 overflow-hidden"
                  style={{
                    width: 72, height: 96,
                    outline: activeImage === i ? "1.5px solid #1a1008" : "1.5px solid transparent",
                    outlineOffset: "1px",
                  }}
                >
                  <Image src={img} alt="" fill className="object-cover object-top" sizes="72px"/>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — product details */}
        <div className="w-[45%] overflow-y-auto bg-white px-10 py-10 border-l border-[#e8e2db]">

          {isNew && (
            <p className="text-[10.5px] italic tracking-[0.18em] text-[#8a7a6a] font-serif mb-1">
              New In
            </p>
          )}

          {/* Name */}
          <h1
            className="text-[#1a1008] leading-none mb-0"
            style={{ fontFamily: "var(--font-script), cursive", fontSize: 52 }}
          >
            {name}
          </h1>

          {/* Colour */}
          <p
            className="text-[#4a3a2a] italic mb-3"
            style={{ fontFamily: "var(--font-script), cursive", fontSize: 20 }}
          >
            in {colorLabel}
          </p>

          <p className="text-[11.5px] tracking-[0.07em] text-[#1a1008] font-serif mb-1">{type}</p>
          <p className="text-[14px] tracking-[0.04em] text-[#1a1008] font-serif mb-6">£{price}</p>

          {/* Swatches */}
          {swatchImages.length > 0 && (
            <div className="flex gap-2 mb-6">
              {swatchImages.map((sw, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSwatch(i)}
                  className="relative overflow-hidden flex-shrink-0"
                  style={{
                    width: 56, height: 72,
                    outline: activeSwatch === i ? "1.5px solid #1a1008" : "1.5px solid #d5cec4",
                    outlineOffset: "2px",
                  }}
                >
                  <Image src={sw.src} alt={sw.colorLabel} fill className="object-cover object-top" sizes="56px"/>
                </button>
              ))}
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="flex items-center gap-5 flex-wrap mb-5">
              {sizes.map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSize(activeSize === s ? null : s)}
                  className={`text-[11.5px] tracking-[0.06em] font-serif pb-0.5 transition-all ${
                    activeSize === s
                      ? "text-[#1a1008] border-b border-[#1a1008]"
                      : "text-[#1a1008] border-b border-transparent hover:opacity-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Countdown */}
          <div className="flex items-center gap-1.5 mb-5 text-[#1a1008]">
            <ClockIcon />
            <p className="text-[10.5px] font-serif tracking-wide">
              Order within{" "}
              <span className="text-[#8B3A3A]">
                {pad(countdown.hrs)} Hrs {pad(countdown.mins)} Mins
              </span>{" "}
              to receive {orderDeadline.date}
            </p>
          </div>

          {/* CTA */}
          <div className="flex gap-[6px] mb-7">
            <button
              className="flex-1 bg-[#2d1f14] hover:bg-[#3a2a1e] text-white text-[11.5px] tracking-[0.14em] font-serif transition-colors"
              style={{ height: 50 }}
            >
              {activeSize ? `Add to Bag — ${activeSize}` : "Select a Size"}
            </button>
            <button
              onClick={() => setWished(w => !w)}
              className="flex items-center justify-center border border-[#c8c0b8] hover:border-[#1a1008] transition-colors"
              style={{ width: 50, height: 50 }}
            >
              <StarIcon filled={wished} />
            </button>
          </div>

          {/* Accordions */}
          <Accordion label="Editor's Notes"     content={editorNotes} />
          <Accordion label="Size & Fit"         content={sizeFit} />
          <Accordion label="Delivery & Returns" content={deliveryReturns} />

          {/* Shop the Look */}
          {shopTheLook.length > 0 && (
            <div className="mt-8">
              <p
                className="text-center text-[#1a1008] mb-1"
                style={{ fontFamily: "var(--font-script), cursive", fontSize: 24 }}
              >
                Shop the Look
              </p>
              <div className="h-px bg-[#e8e2db] mb-4"/>
              <div className="grid grid-cols-2 gap-2">
                {shopTheLook.slice(0, 2).map(p => (
                  <Link
                    key={p.slug}
                    href={`/products/${p.slug}`}
                    className="relative block overflow-hidden group"
                    style={{ aspectRatio: "3/4" }}
                  >
                    <Image
                      src={p.image} alt={p.name} fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      sizes="20vw"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ MOBILE: carousel top, details below ══ */}
      <div className="md:hidden">

        {/* Carousel */}
        <div className="relative w-full overflow-hidden bg-[#f0eeeb]" style={{ aspectRatio: "3/4" }}>
          <div
            className="flex h-full transition-transform duration-500 ease-in-out"
            style={{
              width: `${images.length * 100}%`,
              transform: `translateX(-${(mobileSlide * 100) / images.length}%)`,
            }}
          >
            {images.map((img, i) => (
              <div
                key={i}
                className="relative flex-shrink-0 h-full"
                style={{ width: `${100 / images.length}%` }}
              >
                <Image src={img} alt="" fill className="object-cover object-top" sizes="100vw"/>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setMobileSlide(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: mobileSlide === i ? 14 : 5,
                  height: 3,
                  backgroundColor: mobileSlide === i ? "#1a1008" : "rgba(26,16,8,0.3)",
                }}
              />
            ))}
          </div>

          {/* Eiffel watermark */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-20 text-[#3a2e22] pointer-events-none">
            <EiffelIcon />
          </div>
        </div>

        {/* Mobile details */}
        <div className="bg-white px-5 pt-6 pb-14">
          {isNew && (
            <p className="text-[10.5px] italic tracking-[0.18em] text-[#8a7a6a] font-serif mb-1">New In</p>
          )}

          <h1
            className="text-[#1a1008] leading-none mb-0"
            style={{ fontFamily: "var(--font-script), cursive", fontSize: 42 }}
          >
            {name}
          </h1>
          <p
            className="text-[#4a3a2a] italic mb-2"
            style={{ fontFamily: "var(--font-script), cursive", fontSize: 18 }}
          >
            in {colorLabel}
          </p>
          <p className="text-[11.5px] tracking-[0.06em] text-[#1a1008] font-serif mb-1">{type}</p>
          <p className="text-[13px] tracking-[0.04em] text-[#1a1008] font-serif mb-5">£{price}</p>

          {swatchImages.length > 0 && (
            <div className="flex gap-2 mb-4">
              {swatchImages.map((sw, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSwatch(i)}
                  className="relative overflow-hidden flex-shrink-0"
                  style={{
                    width: 48, height: 64,
                    outline: activeSwatch === i ? "1.5px solid #1a1008" : "1.5px solid #d5cec4",
                    outlineOffset: "2px",
                  }}
                >
                  <Image src={sw.src} alt={sw.colorLabel} fill className="object-cover object-top" sizes="48px"/>
                </button>
              ))}
            </div>
          )}

          {sizes.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap mb-4">
              {sizes.map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSize(activeSize === s ? null : s)}
                  className={`text-[11.5px] tracking-[0.06em] font-serif pb-0.5 transition-all ${
                    activeSize === s
                      ? "text-[#1a1008] border-b border-[#1a1008]"
                      : "text-[#1a1008] border-b border-transparent hover:opacity-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 mb-4 text-[#1a1008]">
            <ClockIcon />
            <p className="text-[10.5px] font-serif tracking-wide">
              Order within{" "}
              <span className="text-[#8B3A3A]">
                {pad(countdown.hrs)} Hrs {pad(countdown.mins)} Mins
              </span>{" "}
              to receive {orderDeadline.date}
            </p>
          </div>

          <div className="flex gap-[6px] mb-6">
            <button
              className="flex-1 bg-[#2d1f14] text-white text-[11.5px] tracking-[0.14em] font-serif"
              style={{ height: 48 }}
            >
              {activeSize ? `Add to Bag — ${activeSize}` : "Select a Size"}
            </button>
            <button
              onClick={() => setWished(w => !w)}
              className="flex items-center justify-center border border-[#c8c0b8]"
              style={{ width: 48, height: 48 }}
            >
              <StarIcon filled={wished} />
            </button>
          </div>

          <Accordion label="Editor's Notes"     content={editorNotes} />
          <Accordion label="Size & Fit"         content={sizeFit} />
          <Accordion label="Delivery & Returns" content={deliveryReturns} />

          {shopTheLook.length > 0 && (
            <div className="mt-6">
              <p
                className="text-center text-[#1a1008] mb-1"
                style={{ fontFamily: "var(--font-script), cursive", fontSize: 22 }}
              >
                Shop the Look
              </p>
              <div className="h-px bg-[#e8e2db] mb-3"/>
              <div className="grid grid-cols-2 gap-1.5">
                {shopTheLook.slice(0, 2).map(p => (
                  <Link key={p.slug} href={`/products/${p.slug}`}
                    className="relative block overflow-hidden" style={{ aspectRatio: "3/4" }}>
                    <Image src={p.image} alt={p.name} fill
                      className="object-cover object-top" sizes="45vw"/>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}