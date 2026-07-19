"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SwatchImage  { src: string; colorLabel: string; }
interface ShopItem     { slug: string; image: string; name: string; }
interface RelatedItem  { slug: string; image: string; name: string; description: string; }
interface Variant      { id: string; size: string; colorLabel: string; stockQuantity: number; priceOverride?: number | null; }

export interface ProductPageProps {
  name:           string;
  colorLabel:     string;
  type:           string;
  price:          number;
  currency?:      string;
  isNew?:         boolean;
  images:         string[];
  swatchImages?:  SwatchImage[];
  sizes?:         string[];
  orderDeadline?: { hrs: number; mins: number; date: string };
  editorNotes?:   string;
  sizeFit?:       string;
  deliveryReturns?: string;
  shopTheLook?:   ShopItem[];
  selectedForYou?: RelatedItem[];
  productId?:     string;
  variants?:      Variant[];
}

// ── Small icon components ─────────────────────────────────────────────────────
const Plus = ({ rotated }: { rotated: boolean }) => (
  <span className={`text-[18px] leading-none text-[#3a2e22] transition-transform duration-300 inline-block ${rotated ? "rotate-45" : ""}`}>+</span>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="0.9" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"
    strokeLinecap="round" className="w-[13px] h-[13px] flex-shrink-0">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3 3"/>
  </svg>
);

const EiffelMark = () => (
  <svg width="20" height="28" viewBox="0 0 32 46" fill="none" className="mx-auto mb-2 opacity-40">
    <rect x="15" y="0" width="2" height="4" fill="#3a2e22"/>
    <polygon points="16,4 12,14 20,14" fill="#3a2e22"/>
    <polygon points="12,14 8,22 24,22 20,14" fill="#3a2e22"/>
    <line x1="8" y1="18" x2="24" y2="18" stroke="#3a2e22" strokeWidth="1.2"/>
    <polygon points="8,22 4,32 28,32 24,22" fill="#3a2e22"/>
    <line x1="4" y1="28" x2="28" y2="28" stroke="#3a2e22" strokeWidth="1.2"/>
    <polygon points="4,32 2,44 30,44 28,32" fill="#3a2e22"/>
  </svg>
);

function Accordion({ label, content, isOpen, onToggle }: {
  label: string; content?: string; isOpen: boolean; onToggle: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  return (
    <div className="border-b border-[#e8e2db]">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between py-4 group">
        <span className="text-[11px] tracking-[0.14em] text-[#3a2e22] uppercase font-serif
          group-hover:opacity-60 transition-opacity">
          {label}
        </span>
        <Plus rotated={isOpen} />
      </button>
      <div
        ref={bodyRef}
        className="overflow-hidden transition-all duration-400 ease-in-out"
        style={{ maxHeight: isOpen ? (bodyRef.current?.scrollHeight ?? 400) + "px" : "0px" }}
      >
        {content ? (
          <p className="text-[12px] leading-[1.85] tracking-[0.03em] text-[#5a4a3a] font-serif pb-5 pr-4">
            {content}
          </p>
        ) : (
          <p className="text-[11.5px] text-[#9a8a7a] font-serif pb-5 italic">Not provided.</p>
        )}
      </div>
    </div>
  );
}

export default function ProductPage({
  name, colorLabel, type, price, currency = "£",
  isNew, images = [], swatchImages = [], sizes = [],
  orderDeadline, editorNotes, sizeFit, deliveryReturns,
  shopTheLook = [], selectedForYou = [],
  productId, variants = [],
}: ProductPageProps) {

  const [imgIdx,       setImgIdx]       = useState(0);
  const [swatchIdx,    setSwatchIdx]    = useState(0);
  const [selSize,      setSelSize]      = useState<string | null>(null);
  const [accordion,    setAccordion]    = useState<string | null>(null);
  const [wished,       setWished]       = useState(false);
  const [cartMsg,      setCartMsg]      = useState<"idle"|"adding"|"added"|"error">("idle");
  const [countdown,    setCountdown]    = useState(orderDeadline ?? null);
  const [imgFade,      setImgFade]      = useState(true);
  const [loaded,       setLoaded]       = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 60); return () => clearTimeout(t); }, []);

  // Helper function defined INSIDE component scope
  const isSizeUnavailable = (size: string) => {
    if (!variants.length) return false;
    const col = swatchImages[swatchIdx]?.colorLabel;
    return !variants.some(v =>
      v.size === size &&
      v.stockQuantity > 0 &&
      (!col || v.colorLabel === col)
    );
  };

  async function handleAddToCart() {
    if (!selSize) { setSelSize("__highlight__"); setTimeout(() => setSelSize(null), 800); return; }
    if (!productId) return;

    const variant = variants.find(v =>
      v.size === selSize &&
      (swatchImages[swatchIdx]
        ? v.colorLabel === swatchImages[swatchIdx].colorLabel
        : true)
    ) ?? variants.find(v => v.size === selSize);

    if (!variant) return;

    setCartMsg("adding");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId: variant.id, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        setCartMsg("added");
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        setCartMsg("error");
      }
    } catch { setCartMsg("error"); }
    setTimeout(() => setCartMsg("idle"), 2500);
  }

  const activeImages = swatchImages.length > 0 && swatchImages[swatchIdx]
    ? [swatchImages[swatchIdx].src, ...images.filter(s => s !== swatchImages[swatchIdx].src)]
    : images;

  const currentImg = activeImages[imgIdx] ?? "";

  function changeImg(idx: number) {
    if (idx === imgIdx) return;
    setImgFade(false);
    setTimeout(() => { setImgIdx(idx); setImgFade(true); }, 120);
  }

  function changeSwatch(idx: number) {
    setSwatchIdx(idx);
    setImgIdx(0);
    setImgFade(false);
    setTimeout(() => setImgFade(true), 120);
  }

  // Mobile swipe
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 44) {
      const next = delta < 0
        ? Math.min(imgIdx + 1, activeImages.length - 1)
        : Math.max(imgIdx - 1, 0);
      changeImg(next);
    }
    touchStartX.current = null;
  }

  const ctaLabel = cartMsg === "adding" ? "Adding…"
    : cartMsg === "added" ? "Added to Bag ✓"
    : cartMsg === "error" ? "Please try again"
    : selSize ? `Add to Bag — ${selSize}`
    : "Select a Size";

  return (
    <>
      <style>{`
        @keyframes ppFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ppShake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        .pp-anim-1 { animation: ppFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .pp-anim-2 { animation: ppFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .pp-anim-3 { animation: ppFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.32s both; }
        .pp-anim-4 { animation: ppFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.44s both; }
        .size-shake { animation: ppShake 0.4s ease; }
      `}</style>

      <div className="min-h-screen bg-[#faf9f7] font-serif">
        <div className="h-[76px] md:h-[88px]" />
        <div className="flex flex-col md:flex-row">
          <div className="md:w-[58%] md:sticky md:top-[88px] md:self-start">
            <div className="hidden md:flex">
              <div className="w-[82px] flex-shrink-0 flex flex-col gap-[3px] p-[3px]">
                {activeImages.map((src, i) => (
                  <button key={i} onClick={() => changeImg(i)}
                    className={`relative overflow-hidden transition-opacity duration-200 ${
                      i === imgIdx ? "opacity-100 ring-1 ring-[#3a2e22]" : "opacity-60 hover:opacity-90"
                    }`}
                    style={{ aspectRatio: "2/3" }}>
                    <Image src={src} alt={`${name} view ${i + 1}`} fill
                      className="object-cover object-top" sizes="82px" />
                  </button>
                ))}
              </div>
              <div className="flex-1 relative overflow-hidden bg-[#f0eeeb]"
                style={{ aspectRatio: "2/3" }}>
                {currentImg && (
                  <Image src={currentImg} alt={name} fill priority
                    className="object-cover object-top transition-opacity duration-200"
                    style={{ opacity: imgFade ? 1 : 0 }}
                    sizes="(max-width:1280px) 50vw, 700px" />
                )}
              </div>
            </div>

            <div className="md:hidden relative overflow-hidden bg-[#f0eeeb]"
              style={{ aspectRatio: "2/3" }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}>
              {activeImages.map((src, i) => (
                <div key={i}
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{ opacity: i === imgIdx ? 1 : 0, zIndex: i === imgIdx ? 1 : 0 }}>
                  <Image src={src} alt={`${name} ${i + 1}`} fill priority={i === 0}
                    className="object-cover object-top" sizes="100vw" />
                </div>
              ))}
            </div>
          </div>

          <div className={`md:w-[42%] px-5 md:px-8 lg:px-12 py-6 md:py-8 ${loaded ? "" : "opacity-0"}`}
            style={loaded ? { animation: "ppFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both" } : {}}>
            {isNew && <p className="text-[10.5px] italic tracking-[0.06em] text-[#3a2e22] mb-2 pp-anim-1">New In</p>}
            <h1 className="leading-[1.0] text-[#1a1008] pp-anim-1" style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(36px, 5vw, 52px)" }}>{name}</h1>
            <p className="italic text-[#5a4a3a] leading-tight mt-0.5 pp-anim-1" style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(16px, 2.5vw, 22px)" }}>in {swatchImages[swatchIdx]?.colorLabel ?? colorLabel}</p>
            <p className="text-[10.5px] tracking-[0.14em] text-[#8a7a6a] uppercase font-serif mt-2 pp-anim-2">{type}</p>
            <p className="text-[14px] tracking-[0.06em] text-[#1a1008] font-serif mt-3 pp-anim-2">{currency}{Number(price).toLocaleString()}</p>
            
            {swatchImages.length > 1 && (
              <div className="flex gap-2 mt-4 pp-anim-3">
                {swatchImages.map((sw, i) => (
                  <button key={i} onClick={() => changeSwatch(i)}
                    className={`relative overflow-hidden transition-all duration-200 flex-shrink-0 ${i === swatchIdx ? "ring-1 ring-[#3a2e22] ring-offset-1" : "opacity-55 hover:opacity-85"}`}
                    style={{ width: 44, height: 60 }}>
                    <Image src={sw.src} alt={sw.colorLabel} fill className="object-cover object-top" sizes="44px" />
                  </button>
                ))}
              </div>
            )}

            {sizes.length > 0 && (
              <div className="mt-5 pp-anim-3">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {sizes.map(size => {
                    const unavailable = isSizeUnavailable(size);
                    const isSelected  = selSize === size;
                    return (
                      <button key={size}
                        onClick={() => setSelSize(isSelected ? null : size)}
                        disabled={unavailable}
                        className={`text-[11.5px] tracking-[0.08em] font-serif pb-0.5 transition-all duration-150 border-b ${
                          unavailable ? "text-[#c8c0b8] line-through border-transparent cursor-not-allowed"
                          : isSelected ? "text-[#1a1008] border-[#1a1008]"
                          : "text-[#5a4a3a] border-transparent hover:text-[#1a1008] hover:border-[#1a1008]"
                        }`}>
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`flex gap-2 mt-5 pp-anim-4 ${selSize === "__highlight__" ? "size-shake" : ""}`}>
              <button
                onClick={handleAddToCart}
                disabled={cartMsg === "adding"}
                className={`flex-1 py-[13px] text-[10.5px] tracking-[0.22em] uppercase font-serif transition-all duration-200 ${
                  cartMsg === "added" ? "bg-green-700 text-white" : cartMsg === "error" ? "bg-red-700 text-white" : "bg-[#3a2e22] text-white hover:bg-[#1a1008]"
                } disabled:opacity-70`}>
                {ctaLabel}
              </button>
              <button
                onClick={() => setWished(w => !w)}
                className={`w-[46px] border flex items-center justify-center transition-colors duration-200 ${
                  wished ? "border-[#3a2e22] bg-[#3a2e22] text-white" : "border-[#3a2e22] text-[#3a2e22] hover:bg-[#3a2e22] hover:text-white"
                }`}>
                <StarIcon filled={wished} />
              </button>
            </div>

            <div className="mt-6 pp-anim-4">
              {[
                { key: "editor",  label: "Editor's Notes",     content: editorNotes },
                { key: "size",    label: "Size & Fit",         content: sizeFit },
                { key: "delivery", label: "Delivery & Returns", content: deliveryReturns },
              ].map(a => (
                <Accordion key={a.key} label={a.label} content={a.content}
                  isOpen={accordion === a.key}
                  onToggle={() => setAccordion(accordion === a.key ? null : a.key)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}