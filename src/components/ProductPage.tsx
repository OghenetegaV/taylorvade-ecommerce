"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCurrency } from "@/lib/currency";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SwatchImage  { src: string; colorLabel: string; }
interface ShopItem     { slug: string; image: string; name: string; }
interface RelatedItem  { slug: string; image: string; name: string; description: string; price?: number; }
interface Variant      { id: string; size: string; colorLabel: string; stockQuantity: number; priceOverride?: number | null; }
interface ReviewItem   {
  id: string; authorName: string; authorLocation: string | null;
  rating: number; title: string | null; body: string;
  verifiedBuyer: boolean; createdAt: string;
}

export interface ProductPageProps {
  name:           string;
  colorLabel:     string;
  type:           string;
  price:          number;
  isNew?:         boolean;
  genders?:       string[];
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
  sizeChart?:     { label: string; values: Record<string, string> }[] | null;
}

const GENDER_LABEL: Record<string, string> = { MEN: "Men", WOMEN: "Women", UNISEX: "Unisex" };

// ── Small icon components ─────────────────────────────────────────────────────
const Plus = ({ rotated }: { rotated: boolean }) => (
  <span className={`text-[19px] leading-none text-[#3a2e22] transition-transform duration-300 inline-block ${rotated ? "rotate-45" : ""}`}>+</span>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="0.9" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
  </svg>
);

const RatingStars = ({ rating, size = 13, onRate }: { rating: number; size?: number; onRate?: (n: number) => void }) => (
  <span className="inline-flex items-center gap-[2px]">
    {[1, 2, 3, 4, 5].map(n => (
      <span key={n} onClick={onRate ? () => onRate(n) : undefined}
        className={onRate ? "cursor-pointer" : undefined}>
        <svg viewBox="0 0 24 24" fill={n <= Math.round(rating) ? "#3a2e22" : "none"}
          stroke="#3a2e22" strokeWidth="1" style={{ width: size, height: size }}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
        </svg>
      </span>
    ))}
  </span>
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
        <span className="text-[12.5px] tracking-[0.14em] text-[#3a2e22] uppercase font-serif
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
          <p className="text-[13.5px] leading-[1.85] tracking-[0.03em] text-[#5a4a3a] font-serif pb-5 pr-4">
            {content}
          </p>
        ) : (
          <p className="text-[13px] text-[#9a8a7a] font-serif pb-5 italic">Not provided.</p>
        )}
      </div>
    </div>
  );
}

export default function ProductPage({
  name, colorLabel, type, price,
  isNew, genders = [], images = [], swatchImages = [], sizes = [],
  orderDeadline, editorNotes, sizeFit, deliveryReturns,
  shopTheLook = [], selectedForYou = [],
  productId, variants = [], sizeChart,
}: ProductPageProps) {

  const { format } = useCurrency();
  const router = useRouter();
  const pathname = usePathname();
  const [imgIdx,       setImgIdx]       = useState(0);
  const [swatchIdx,    setSwatchIdx]    = useState(0);
  const [selSize,      setSelSize]      = useState<string | null>(null);
  const [accordion,    setAccordion]    = useState<string | null>("editor");
  const [wished,       setWished]       = useState(false);
  const [wishBusy,     setWishBusy]     = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [cartMsg,      setCartMsg]      = useState<"idle"|"adding"|"added"|"error">("idle");
  const [countdown,    setCountdown]    = useState(orderDeadline ?? null);
  const [imgFade,      setImgFade]      = useState(true);
  const [loaded,       setLoaded]       = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Reviews
  const [reviews,       setReviews]       = useState<ReviewItem[]>([]);
  const [reviewAvg,     setReviewAvg]     = useState(0);
  const [reviewCount,   setReviewCount]   = useState(0);
  const [reviewSort,    setReviewSort]    = useState<"recent" | "highest" | "lowest">("recent");
  const [reviewQuery,   setReviewQuery]   = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({ authorName: "", authorLocation: "", rating: 5, title: "", body: "" });
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null);

  const fetchReviews = () => {
    if (!productId) return;
    const params = new URLSearchParams({ productId, sort: reviewSort });
    if (reviewQuery.trim()) params.set("query", reviewQuery.trim());
    fetch(`/api/reviews?${params}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) return;
        setReviews(d.data.reviews);
        setReviewAvg(d.data.average);
        setReviewCount(d.data.count);
      })
      .catch(() => {});
  };

  useEffect(fetchReviews, [productId, reviewSort, reviewQuery]);

  async function submitReview() {
    if (!productId) return;
    setReviewSubmitError(null);
    if (!reviewForm.authorName.trim() || !reviewForm.body.trim()) {
      setReviewSubmitError("Please add your name and a review.");
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, ...reviewForm }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Could not submit review");
      setReviewModalOpen(false);
      setReviewForm({ authorName: "", authorLocation: "", rating: 5, title: "", body: "" });
      setReviewSort("recent");
      fetchReviews();
    } catch (e) {
      setReviewSubmitError(e instanceof Error ? e.message : "Could not submit review");
    } finally {
      setReviewSubmitting(false);
    }
  }

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 60); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/wishlist?productId=${productId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setWished(d.data.inWishlist); })
      .catch(() => {});
  }, [productId]);

  async function toggleWishlist() {
    if (!productId || wishBusy) return;
    const next = !wished;
    setWished(next);
    setWishBusy(true);
    try {
      const res = next
        ? await fetch("/api/wishlist", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          })
        : await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
      if (res.status === 401) {
        setWished(!next);
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      }
    } catch {
      setWished(!next);
    } finally {
      setWishBusy(false);
    }
  }

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
    if (outOfStock) return;
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
        window.dispatchEvent(new Event("openCartDrawer"));
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

  const outOfStock = variants.length > 0 && variants.every(v => v.stockQuantity <= 0);

  const ctaLabel = outOfStock ? "Notify Me When Available"
    : cartMsg === "adding" ? "Adding…"
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
        <div className="flex flex-col md:flex-row md:px-16 md:gap-10">
          <div className="md:w-1/2 md:sticky md:top-0 md:self-start">
            <div className="hidden md:flex md:items-center">
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

            <div className="md:hidden relative overflow-hidden bg-[#f0eeeb] h-[80svh]"
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

            {activeImages.length > 1 && (
              <div className="md:hidden flex items-center justify-center gap-2 py-4">
                {activeImages.map((_, i) => (
                  <button key={i} onClick={() => changeImg(i)} aria-label={`View image ${i + 1}`}
                    className={`w-[7px] h-[7px] rounded-full transition-colors duration-200 ${
                      i === imgIdx ? "bg-[#3a2e22]" : "bg-[#d8d2c8]"
                    }`} />
                ))}
              </div>
            )}
          </div>

          <div className={`md:w-1/2 px-5 md:px-0 pt-6 md:pt-[104px] pb-6 md:pb-8 ${loaded ? "" : "opacity-0"}`}
            style={loaded ? { animation: "ppFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both" } : {}}>
            <div className="text-center">
              {(outOfStock || genders.length > 0 || isNew) && (
                <div className="flex items-center justify-center gap-3 mb-2 pp-anim-1">
                  {outOfStock && (
                    <span className="italic underline underline-offset-2 tracking-[0.02em] text-[12px] text-[#3a2e22]">
                      Notify Me When Available
                    </span>
                  )}
                  {genders.length > 0 && (
                    <span className="italic underline underline-offset-2 tracking-[0.02em] text-[12px] text-[#3a2e22]">
                      {genders.map(g => GENDER_LABEL[g] ?? g).join(" / ")}
                    </span>
                  )}
                  {isNew && (
                    <span className="italic underline underline-offset-2 tracking-[0.02em] text-[12px] text-[#3a2e22]">
                      New In
                    </span>
                  )}
                </div>
              )}
              <h1 className="leading-[1.0] text-[#1a1008] pp-anim-1" style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(36px, 5vw, 52px)" }}>{name}</h1>
              <p className="italic text-[#5a4a3a] leading-tight mt-0.5 pp-anim-1" style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(16px, 2.5vw, 22px)" }}>in {swatchImages[swatchIdx]?.colorLabel ?? colorLabel}</p>
              <p className="text-[12px] tracking-[0.14em] text-[#8a7a6a] uppercase font-serif mt-2 pp-anim-2">{type}</p>
              <p className="text-[17px] tracking-[0.06em] text-[#1a1008] font-serif font-medium mt-1.5 pp-anim-2">{format(Number(price))}</p>

              {reviewCount > 0 && (
                <a href="#reviews" className="flex items-center justify-center gap-2 mt-2.5 pp-anim-2 hover:opacity-70 transition-opacity">
                  <RatingStars rating={reviewAvg} size={13} />
                  <span className="text-[12px] text-[#5a4a3a] font-serif underline underline-offset-2">
                    {reviewCount} {reviewCount === 1 ? "Review" : "Reviews"}
                  </span>
                </a>
              )}

              {swatchImages.length > 1 && (
                <div className="flex justify-center gap-2 mt-4 pp-anim-3">
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
                  {sizeChart && sizeChart.length > 0 && (
                    <button type="button" onClick={() => setSizeGuideOpen(true)}
                      className="text-[12px] tracking-[0.1em] uppercase text-[#8a7a6a] underline
                        underline-offset-2 hover:text-[#3a2e22] transition-colors mb-2 block mx-auto">
                      Size Guide
                    </button>
                  )}
                  <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                    {sizes.map(size => {
                      const unavailable = isSizeUnavailable(size);
                      const isSelected  = selSize === size;
                      return (
                        <button key={size}
                          onClick={() => setSelSize(isSelected ? null : size)}
                          disabled={unavailable}
                          className={`text-[13px] tracking-[0.08em] font-serif pb-0.5 transition-all duration-150 border-b ${
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
            </div>

            <div className={`flex gap-2 mt-5 pp-anim-4 ${selSize === "__highlight__" ? "size-shake" : ""}`}>
              <button
                onClick={handleAddToCart}
                disabled={cartMsg === "adding" || outOfStock}
                className={`flex-1 py-[13px] text-[12px] tracking-[0.22em] uppercase font-serif transition-all duration-200 ${
                  cartMsg === "added" ? "bg-green-700 text-white" : cartMsg === "error" ? "bg-red-700 text-white" : "bg-[#4B3E3C] text-white hover:bg-[#1a1008]"
                } disabled:opacity-70`}>
                {ctaLabel}
              </button>
              <button
                onClick={toggleWishlist}
                className={`w-[46px] border flex items-center justify-center transition-colors duration-200 ${
                  wished ? "border-[#3a2e22] bg-[#4B3E3C] text-white" : "border-[#3a2e22] text-[#3a2e22] hover:bg-[#4B3E3C] hover:text-white"
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

            {shopTheLook.length > 0 && (
              <div className="mt-8 pp-anim-4">
                <h2 className="text-center text-[#1a1008] mb-2"
                  style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(22px, 2.5vw, 28px)" }}>
                  Shop the Look
                </h2>
                <div className="w-full max-w-[180px] mx-auto border-b border-[#4B3E3C] mb-6" />
                <div className="grid grid-cols-2 gap-4">
                  {shopTheLook.map(item => (
                    <Link key={item.slug} href={`/products/${item.slug}`} className="group block">
                      <div className="relative overflow-hidden bg-[#f0eeeb]" style={{ aspectRatio: "2/3" }}>
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill
                            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                            sizes="(max-width:768px) 50vw, 25vw" />
                        )}
                      </div>
                      <p className="text-[15.5px] text-center text-[#111] leading-tight truncate mt-2.5"
                        style={{ fontFamily: "var(--font-script), cursive" }}>
                        {item.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedForYou.length > 0 && (
          <section className="px-5 md:px-12 py-12 md:py-16">
            <h2 className="text-center text-[#1a1008] mb-2"
              style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(24px, 3vw, 32px)" }}>
              Selected for You
            </h2>
            <div className="w-full border-b border-[#4B3E3C] mb-8" />
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-6"
              style={{ scrollbarWidth: "none" }}>
              {selectedForYou.map(item => (
                <Link key={item.slug} href={`/products/${item.slug}`}
                  className="group block text-center snap-start flex-shrink-0 w-[42vw] sm:w-[28vw] md:w-auto">
                  <div className="relative overflow-hidden bg-[#f0eeeb]" style={{ aspectRatio: "2/3" }}>
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                        sizes="(max-width:768px) 42vw, 200px" />
                    )}
                  </div>
                  <p className="text-[13.5px] text-[#111] leading-tight truncate mt-2.5"
                    style={{ fontFamily: "var(--font-script), cursive" }}>
                    {item.name}
                  </p>
                  <p className="text-[12px] text-[#999] font-serif truncate">{item.description}</p>
                  {item.price != null && (
                    <p className="text-[12px] text-[#999] font-serif mt-0.5">{format(item.price)}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {productId && (
          <section id="reviews" className="px-5 md:px-12 py-12 md:py-16 scroll-mt-20">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[20px] text-[#1a1008] font-serif font-medium">{reviewAvg.toFixed(1)}</span>
                <RatingStars rating={reviewAvg} size={17} />
              </div>
              <button onClick={() => setReviewModalOpen(true)}
                className="border border-[#3a2e22] text-[#3a2e22] text-[11.5px] tracking-[0.1em] uppercase
                  font-serif px-5 py-2.5 hover:bg-[#3a2e22] hover:text-white transition-colors">
                Write a Review
              </button>
            </div>
            <p className="text-[12.5px] text-[#8a7a6a] font-serif mb-8">Based on {reviewCount} {reviewCount === 1 ? "Review" : "Reviews"}</p>

            <div className="flex items-center justify-between border-b border-[#e8e2db] pb-3 mb-6">
              <span className="text-[12.5px] tracking-[0.14em] uppercase text-[#1a1008] font-serif border-b-2 border-[#3a2e22] pb-3 -mb-3">
                Reviews {reviewCount}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-[11.5px] tracking-[0.1em] uppercase text-[#5a4a3a] font-serif">Filter Reviews:</span>
                <select value={reviewSort} onChange={e => setReviewSort(e.target.value as typeof reviewSort)}
                  className="text-[12.5px] font-serif text-[#3a2e22] border border-[#d5cec4] px-3 py-1.5 outline-none">
                  <option value="recent">Most Recent</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
              </div>
              <input value={reviewQuery} onChange={e => setReviewQuery(e.target.value)}
                placeholder="Search Reviews"
                className="flex-1 min-w-[200px] max-w-sm border border-[#d5cec4] px-3.5 py-2
                  text-[12.5px] font-serif text-[#3a2e22] outline-none focus:border-[#3a2e22] transition-colors" />
            </div>

            {reviews.length === 0 ? (
              <p className="text-[13px] text-[#8a7a6a] font-serif italic">
                {reviewCount === 0 ? "Be the first to review this piece." : "No reviews match your search."}
              </p>
            ) : (
              <div className="space-y-8">
                {reviews.map(r => (
                  <div key={r.id} className="border-b border-[#e8e2db] pb-8">
                    <div className="flex items-start justify-between gap-4 mb-1.5">
                      <div>
                        <span className="text-[13px] text-[#1a1008] font-serif font-medium">{r.authorName}</span>
                        {r.verifiedBuyer && (
                          <span className="text-[11px] text-[#8a7a6a] font-serif"> · Verified Buyer</span>
                        )}
                        {r.authorLocation && (
                          <p className="text-[11.5px] text-[#9a8a7a] font-serif">{r.authorLocation}</p>
                        )}
                      </div>
                      <span className="text-[11.5px] text-[#9a8a7a] font-serif flex-shrink-0">
                        {new Date(r.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" })}
                      </span>
                    </div>
                    <RatingStars rating={r.rating} size={13} />
                    {r.title && <p className="text-[13.5px] text-[#1a1008] font-serif font-medium mt-2">{r.title}</p>}
                    <p className="text-[13px] leading-relaxed text-[#5a4a3a] font-serif mt-1.5">{r.body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReviewModalOpen(false)} />
          <div className="relative bg-[#faf9f7] max-w-md w-full max-h-[85vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] tracking-[0.14em] uppercase text-[#1a1008] font-serif">Write a Review</h2>
              <button onClick={() => setReviewModalOpen(false)}
                className="text-[#8a7a6a] hover:text-[#1a1008] transition-colors text-[14.5px]">
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] tracking-[0.1em] uppercase text-[#8a7a6a] font-serif mb-1.5">Rating</label>
                <RatingStars rating={reviewForm.rating} size={22}
                  onRate={n => setReviewForm(f => ({ ...f, rating: n }))} />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.1em] uppercase text-[#8a7a6a] font-serif mb-1.5">Name *</label>
                <input value={reviewForm.authorName} onChange={e => setReviewForm(f => ({ ...f, authorName: e.target.value }))}
                  className="w-full border border-[#d5cec4] px-3.5 py-2.5 text-[13px] font-serif text-[#3a2e22]
                    outline-none focus:border-[#3a2e22] transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.1em] uppercase text-[#8a7a6a] font-serif mb-1.5">Location (optional)</label>
                <input value={reviewForm.authorLocation} onChange={e => setReviewForm(f => ({ ...f, authorLocation: e.target.value }))}
                  placeholder="e.g. Lagos, Nigeria"
                  className="w-full border border-[#d5cec4] px-3.5 py-2.5 text-[13px] font-serif text-[#3a2e22]
                    outline-none focus:border-[#3a2e22] transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.1em] uppercase text-[#8a7a6a] font-serif mb-1.5">Title (optional)</label>
                <input value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-[#d5cec4] px-3.5 py-2.5 text-[13px] font-serif text-[#3a2e22]
                    outline-none focus:border-[#3a2e22] transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.1em] uppercase text-[#8a7a6a] font-serif mb-1.5">Review *</label>
                <textarea rows={4} value={reviewForm.body} onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))}
                  className="w-full border border-[#d5cec4] px-3.5 py-2.5 text-[13px] font-serif text-[#3a2e22]
                    outline-none focus:border-[#3a2e22] transition-colors resize-none" />
              </div>

              {reviewSubmitError && (
                <p className="text-[12px] text-red-700 font-serif">{reviewSubmitError}</p>
              )}

              <button onClick={submitReview} disabled={reviewSubmitting}
                className="w-full bg-[#4B3E3C] text-white text-[12px] tracking-[0.2em] uppercase font-serif
                  py-3.5 hover:bg-[#1a1008] transition-colors disabled:opacity-60">
                {reviewSubmitting ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sizeGuideOpen && sizeChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSizeGuideOpen(false)} />
          <div className="relative bg-[#faf9f7] max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] tracking-[0.14em] uppercase text-[#1a1008] font-serif">Size Guide</h2>
              <button onClick={() => setSizeGuideOpen(false)}
                className="text-[#8a7a6a] hover:text-[#1a1008] transition-colors text-[14.5px]">
                Close
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px] font-serif border-collapse">
                <thead>
                  <tr className="border-b border-[#e8e2db]">
                    <th className="text-left py-2 pr-3 text-[#8a7a6a] uppercase tracking-[0.06em] text-[12px]">Measurement</th>
                    {Object.keys(sizeChart[0]?.values ?? {}).map(size => (
                      <th key={size} className="text-center py-2 px-2 text-[#8a7a6a] uppercase tracking-[0.06em] text-[12px]">
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.map(row => (
                    <tr key={row.label} className="border-b border-[#e8e2db]">
                      <td className="py-2 pr-3 text-[#3a2e22]">{row.label}</td>
                      {Object.keys(sizeChart[0]?.values ?? {}).map(size => (
                        <td key={size} className="text-center py-2 px-2 text-[#5a4a3a]">
                          {row.values[size] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}