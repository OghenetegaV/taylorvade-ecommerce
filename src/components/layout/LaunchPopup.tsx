// src/components/layout/LaunchPopup.tsx
// New Collection launch popup — opens as soon as a visitor lands on any store
// page and captures early-access emails (source "launch-popup", see
// /api/newsletter/subscribe). Signups appear at /admin/subscribers.
//
// Shown again after DISMISS_DAYS if closed; never again once subscribed.

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { SUBSCRIBER_DISCOUNT_PERCENT } from "@/lib/subscriberOffer";

const DISMISSED_KEY  = "tv_launch_dismissed";
const SUBSCRIBED_KEY = "tv_newsletter_subscribed";
const DISMISS_DAYS   = 3;
const OPEN_DELAY_MS  = 700;

const CREAM = "#f3ede4";
const INK   = "#15110e";
const TAN   = "#c9a77c";

function readStorage(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

const rise = {
  hidden: { opacity: 0, y: 14 },
  show:   (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.25 + i * 0.09, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/**
 * `standalone` = the /launch page: always shown (ignores dismiss/subscribed
 * memory), and closing it takes the visitor to the homepage.
 */
export default function LaunchPopup({ standalone = false }: { standalone?: boolean }) {
  const router = useRouter();
  const [open,  setOpen]  = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg,   setMsg]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (standalone) {
      const t = setTimeout(() => setOpen(true), 50);
      return () => clearTimeout(t);
    }
    if (readStorage(SUBSCRIBED_KEY)) return;
    const dismissed = Number(readStorage(DISMISSED_KEY));
    if (dismissed && (Date.now() - dismissed) / 86_400_000 < DISMISS_DAYS) return;
    const t = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(t);
  }, [standalone]);

  // Lock page scroll, close on Escape, focus the email field.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("keydown", onKey);
    const f = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 650);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      clearTimeout(f);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    if (state !== "done") writeStorage(DISMISSED_KEY, String(Date.now()));
    setOpen(false);
    if (standalone) router.push("/");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || state === "busy") return;
    setState("busy");
    try {
      const r = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, categories: ["All"], smsOptIn: false, source: "launch-popup" }),
      });
      const d = await r.json();
      if (d.success) {
        setState("done");
        writeStorage(SUBSCRIBED_KEY, "true");
        if (!standalone) setTimeout(() => setOpen(false), 4500);
      } else {
        setState("error");
        setMsg(d.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setState("error");
      setMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="launch-popup"
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Backdrop */}
          <div
            onClick={dismiss}
            className="absolute inset-0 bg-black/70 backdrop-blur-[3px]"
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="launch-title"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full sm:max-w-[900px] max-h-[100svh] sm:max-h-[90svh] overflow-y-auto
              [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
              grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
            style={{ background: INK, color: CREAM }}
          >
            {/* Close */}
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-3.5 right-3.5 z-10 w-9 h-9 flex items-center justify-center
                rounded-full bg-black/35 md:bg-transparent hover:bg-white/10 transition-colors"
            >
              <X size={18} strokeWidth={1.3} color={CREAM} />
            </button>

            {/* ── Visual ── */}
            <div className="relative h-[210px] sm:h-[260px] md:h-auto md:min-h-[min(580px,90svh)] overflow-hidden">
              <Image
                src="/videos/campaign-poster.jpg"
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 460px, 100vw"
                className="object-cover object-[50%_25%] md:hidden"
              />
              <video
                className="hidden md:block absolute inset-0 w-full h-full object-cover"
                src="/videos/campaign.mp4"
                poster="/videos/campaign-poster.jpg"
                autoPlay muted loop playsInline
                aria-hidden
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#15110e] via-[#15110e]/10 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#15110e]/60" />
              <span
                className="absolute left-5 bottom-4 md:left-6 md:bottom-6 text-[10.5px] tracking-[0.4em] uppercase font-serif"
                style={{ color: CREAM, opacity: 0.85 }}
              >
                Lagos &mdash; Dec &rsquo;26
              </span>
            </div>

            {/* ── Copy + form ── */}
            <div className="relative flex flex-col justify-center px-7 sm:px-10 md:px-12 pt-7 pb-9 md:py-14 [@media(max-height:720px)]:md:py-7 text-center md:text-left">
              <motion.div custom={0} variants={rise} initial="hidden" animate="show"
                className="relative w-[118px] h-[34px] mx-auto md:mx-0"
                style={{ filter: "brightness(0) invert(1)" }}
              >
                <Image src="/logo.png" alt="Taylor Vade" fill className="object-contain object-center md:object-left" sizes="118px" />
              </motion.div>

              <AnimatePresence mode="wait">
                {state === "done" ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-12 md:mt-16"
                    role="status"
                  >
                    <p style={{ fontFamily: "var(--font-script), serif", fontSize: "clamp(30px,4vw,40px)" }}>
                      You&apos;re on the list.
                    </p>
                    <p className="mt-4 text-[13.5px] font-serif tracking-[0.04em] leading-relaxed" style={{ color: `${CREAM}b3` }}>
                      Check your inbox &mdash; your personal{" "}
                      <span style={{ color: TAN }}>{SUBSCRIBER_DISCOUNT_PERCENT}% off</span> code is on its way.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="form" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <motion.p custom={1} variants={rise} initial="hidden" animate="show"
                      className="mt-10 md:mt-14 [@media(max-height:720px)]:md:mt-6 text-[10.5px] tracking-[0.42em] uppercase font-serif"
                      style={{ color: TAN }}
                    >
                      Coming soon
                    </motion.p>

                    <motion.h2 custom={2} variants={rise} initial="hidden" animate="show"
                      id="launch-title"
                      className="mt-3 leading-[1.02]"
                      style={{ fontFamily: "var(--font-script), serif", fontSize: "clamp(34px,5.2vw,56px)" }}
                    >
                      The New<br className="hidden md:block" /> Collection.
                    </motion.h2>

                    <motion.div custom={3} variants={rise} initial="hidden" animate="show"
                      className="mt-5 flex items-center justify-center md:justify-start gap-3"
                    >
                      <span className="h-px w-5 sm:w-8 shrink-0" style={{ background: TAN }} />
                      <span className="whitespace-nowrap text-[12px] tracking-[0.28em] sm:tracking-[0.38em] uppercase font-serif">Dropping December</span>
                      <span className="h-px w-5 sm:w-8 shrink-0 md:hidden" style={{ background: TAN }} />
                    </motion.div>

                    <motion.p custom={4} variants={rise} initial="hidden" animate="show"
                      className="mt-7 text-[14.5px] font-serif tracking-[0.03em]"
                      style={{ color: `${CREAM}b3` }}
                    >
                      Sign up for early access
                      <br />
                      <span style={{ color: CREAM }}>
                        and get <span style={{ color: TAN }}>{SUBSCRIBER_DISCOUNT_PERCENT}% off</span> your order.
                      </span>
                    </motion.p>

                    <motion.form custom={5} variants={rise} initial="hidden" animate="show"
                      onSubmit={submit} className="mt-5"
                    >
                      <label htmlFor="launch-email" className="sr-only">Email address</label>
                      <div className="flex items-stretch border transition-colors focus-within:border-[#f3ede4]"
                        style={{ borderColor: `${CREAM}40` }}
                      >
                        <input
                          ref={inputRef}
                          id="launch-email"
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={e => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
                          placeholder="Your email address"
                          className="flex-1 min-w-0 bg-transparent px-4 py-3.5 text-[14.5px] font-serif
                            outline-none placeholder:text-[#f3ede4]/35"
                          style={{ color: CREAM }}
                        />
                        <button
                          type="submit"
                          disabled={state === "busy"}
                          aria-label="Get early access"
                          className="px-4 sm:px-5 flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase font-serif
                            transition-colors disabled:opacity-60 hover:opacity-90"
                          style={{ background: CREAM, color: INK }}
                        >
                          {state === "busy"
                            ? <Loader2 size={15} className="animate-spin" />
                            : <><span className="hidden sm:inline">Get access</span><ArrowRight size={15} strokeWidth={1.5} /></>}
                        </button>
                      </div>
                      {state === "error" && (
                        <p className="mt-2.5 text-[12.5px] font-serif text-red-300" role="alert">{msg}</p>
                      )}
                    </motion.form>

                    <motion.p custom={6} variants={rise} initial="hidden" animate="show"
                      className="mt-5 text-[11px] font-serif tracking-[0.04em]"
                      style={{ color: `${CREAM}66` }}
                    >
                      By signing up you agree to our{" "}
                      <a href="/privacy" className="underline underline-offset-2 hover:text-[#f3ede4]">Privacy Policy</a>.
                    </motion.p>

                    <motion.button custom={7} variants={rise} initial="hidden" animate="show"
                      type="button" onClick={dismiss}
                      className="mt-6 text-[11px] tracking-[0.25em] uppercase font-serif hover:text-[#f3ede4] transition-colors"
                      style={{ color: `${CREAM}80` }}
                    >
                      Continue to site
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
