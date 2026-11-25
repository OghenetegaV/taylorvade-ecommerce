// src/app/launch/LaunchSignup.tsx
// Pre-launch holding card shown at /launch while the site is private
// (see src/lib/launch.ts and src/proxy.ts). Captures early-access emails
// (source "launch-popup") — signups appear at /admin/subscribers and each new
// subscriber is emailed a personal welcome code.
//
// Design: the dark two-column campaign card (film left, copy right).

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { SUBSCRIBER_DISCOUNT_PERCENT } from "@/lib/subscriberOffer";

const SUBSCRIBED_KEY = "tv_newsletter_subscribed";

const CREAM = "#f3ede4";
const INK   = "#15110e";
const TAN   = "#c9a77c";

const rise = {
  hidden: { opacity: 0, y: 14 },
  show:   (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.25 + i * 0.09, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function LaunchSignup({ launchLabel }: { launchLabel: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg,   setMsg]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const f = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 800);
    return () => clearTimeout(f);
  }, []);

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
        try { localStorage.setItem(SUBSCRIBED_KEY, "true"); } catch {}
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
    <main className="relative z-10 min-h-svh flex items-center justify-center sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full sm:max-w-[900px] max-h-svh sm:max-h-[90svh] overflow-y-auto
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        style={{ background: INK, color: CREAM }}
      >
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
            Launching &mdash; Dec &rsquo;26
          </span>
        </div>

        {/* ── Copy + form ── */}
        <div className="relative flex flex-col justify-center px-7 sm:px-10 md:px-12 pt-7 pb-9 md:py-14 [@media(max-height:720px)]:md:py-7 text-center md:text-left">
          <motion.div custom={0} variants={rise} initial="hidden" animate="show"
            className="relative w-[118px] h-[34px] mx-auto md:mx-0"
            style={{ filter: "brightness(0) invert(1)" }}
          >
            <Image src="/logo.png" alt="Taylor Vade" fill priority className="object-contain object-center md:object-left" sizes="118px" />
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
                <p className="text-[10.5px] tracking-[0.42em] uppercase font-serif" style={{ color: TAN }}>
                  You&apos;re on the list
                </p>
                <p className="mt-3 leading-[1.05]"
                  style={{ fontFamily: "var(--font-script), serif", fontSize: "clamp(30px,4vw,42px)" }}>
                  Welcome to the next chapter.
                </p>
                <p className="mt-4 text-[13.5px] font-serif tracking-[0.04em] leading-relaxed" style={{ color: `${CREAM}b3` }}>
                  Check your inbox &mdash; your personal{" "}
                  <span style={{ color: TAN }}>{SUBSCRIBER_DISCOUNT_PERCENT}% off</span> code is on its way,
                  ready for launch day on {launchLabel}.
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <motion.p custom={1} variants={rise} initial="hidden" animate="show"
                  className="mt-10 md:mt-14 [@media(max-height:720px)]:md:mt-6 text-[10.5px] tracking-[0.42em] uppercase font-serif"
                  style={{ color: TAN }}
                >
                  A New Chapter Begins
                </motion.p>

                <motion.h1 custom={2} variants={rise} initial="hidden" animate="show"
                  className="mt-3 leading-[1.04] text-balance text-[clamp(30px,3.5vw,42px)] [@media(max-height:720px)]:md:text-[34px]"
                  style={{ fontFamily: "var(--font-script), serif" }}
                >
                  Something Worth Waiting For.
                </motion.h1>

                <motion.div custom={3} variants={rise} initial="hidden" animate="show"
                  className="mt-5 flex items-center justify-center md:justify-start gap-3"
                >
                  <span className="h-px w-5 sm:w-8 shrink-0" style={{ background: TAN }} />
                  <span className="whitespace-nowrap text-[12px] tracking-[0.28em] sm:tracking-[0.38em] uppercase font-serif">
                    Launching {launchLabel}
                  </span>
                  <span className="h-px w-5 sm:w-8 shrink-0 md:hidden" style={{ background: TAN }} />
                </motion.div>

                <motion.p custom={4} variants={rise} initial="hidden" animate="show"
                  className="mt-6 [@media(max-height:720px)]:md:mt-4 text-[14.5px] font-serif tracking-[0.03em] leading-relaxed text-pretty"
                  style={{ color: `${CREAM}b3` }}
                >
                  Be among the first to experience the new Taylor Vade. Join our early access list and get{" "}
                  <span style={{ color: TAN }}>{SUBSCRIBER_DISCOUNT_PERCENT}% off</span>{" "}
                  <span style={{ color: CREAM }}>your first order.</span>
                </motion.p>

                <motion.form custom={5} variants={rise} initial="hidden" animate="show"
                  onSubmit={submit} className="mt-5"
                >
                  <label htmlFor="launch-email" className="sr-only">Email address</label>
                  <div className="border transition-colors focus-within:border-[#f3ede4]"
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
                      className="w-full bg-transparent px-4 py-3.5 text-[14.5px] font-serif text-center md:text-left
                        outline-none placeholder:text-[#f3ede4]/35"
                      style={{ color: CREAM }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={state === "busy"}
                    className="group mt-2.5 w-full py-3.5 flex items-center justify-center gap-2.5 text-[11.5px] tracking-[0.26em]
                      uppercase font-serif transition-opacity disabled:opacity-60 hover:opacity-90"
                    style={{ background: CREAM, color: INK }}
                  >
                    {state === "busy"
                      ? <Loader2 size={15} className="animate-spin" />
                      : <>Join the waitlist<ArrowRight size={15} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" /></>}
                  </button>
                  {state === "error" && (
                    <p className="mt-2.5 text-[12.5px] font-serif text-red-300" role="alert">{msg}</p>
                  )}
                </motion.form>

                <motion.p custom={6} variants={rise} initial="hidden" animate="show"
                  className="mt-4 text-[10px] sm:text-[10.5px] tracking-[0.16em] sm:tracking-[0.3em] uppercase font-serif"
                  style={{ color: `${CREAM}99` }}
                >
                  Early access &middot; First releases &middot; {SUBSCRIBER_DISCOUNT_PERCENT}% off
                </motion.p>

                <motion.p custom={7} variants={rise} initial="hidden" animate="show"
                  className="mt-3 text-[11px] font-serif tracking-[0.04em]"
                  style={{ color: `${CREAM}66` }}
                >
                  By signing up you agree to our{" "}
                  <a href="/privacy" className="underline underline-offset-2 hover:text-[#f3ede4]">Privacy Policy</a>.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
