// src/app/launch/LaunchSignup.tsx
// Pre-launch holding card shown at /launch while the site is private
// (see src/lib/launch.ts and src/proxy.ts). Captures early-access emails
// (source "launch-popup") — signups appear at /admin/subscribers and each new
// subscriber is emailed a personal welcome code.

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { SUBSCRIBER_DISCOUNT_PERCENT } from "@/lib/subscriberOffer";

const SUBSCRIBED_KEY = "tv_newsletter_subscribed";

const PAPER      = "#f4f1ec";
const PAPER_DEEP = "#e9e5de";
const INK        = "#141210";
const MUTED      = "#6f6a63";


const rise = {
  hidden: { opacity: 0, y: 14 },
  show:   (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function LaunchSignup({ launchLabel }: { launchLabel: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg,   setMsg]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const f = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 700);
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
    <main
      className="min-h-svh flex items-center justify-center p-4 font-sans"
      style={{ background: PAPER_DEEP, color: INK }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] rounded-[22px] p-4 sm:p-5 shadow-[0_30px_80px_rgba(0,0,0,0.14)]"
        style={{ background: PAPER }}
      >
        {/* Header: logo + label */}
        <motion.div custom={0} variants={rise} initial="hidden" animate="show"
          className="flex items-center justify-between px-1 pb-3"
        >
          <h1 className="relative w-[104px] h-[30px]">
            <Image src="/logo.png" alt="Taylor Vade" fill priority sizes="104px"
              className="object-contain object-left" style={{ filter: "brightness(0)" }} />
          </h1>
          <span className="text-[11px] tracking-[0.18em] uppercase font-medium" style={{ color: MUTED }}>
            Coming Soon
          </span>
        </motion.div>

        {/* Image */}
        <motion.div custom={1} variants={rise} initial="hidden" animate="show"
          className="relative w-full overflow-hidden rounded-[16px]"
          style={{ height: "clamp(110px, calc(94svh - 470px), 300px)", background: PAPER_DEEP }}
        >
          <Image
            src="/videos/campaign-poster.jpg"
            alt="Taylor Vade campaign"
            fill
            priority
            sizes="420px"
            className="object-cover object-[50%_22%]"
          />
          <span className="absolute left-3 bottom-3 rounded-full px-3 py-1 text-[11px] font-medium backdrop-blur-md"
            style={{ background: "rgba(255,255,255,0.72)", color: INK }}>
            Launching {launchLabel}
          </span>
        </motion.div>

        <AnimatePresence mode="wait">
          {state === "done" ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center px-2 pt-7 pb-5"
              role="status"
            >
              <p className="text-[11px] tracking-[0.2em] uppercase font-medium" style={{ color: MUTED }}>
                You&apos;re on the list
              </p>
              <p className="mt-2 text-[26px] leading-tight font-semibold tracking-[-0.01em] text-balance">
                Welcome to the next chapter.
              </p>
              <p className="mt-3 text-[14.5px] leading-relaxed text-pretty" style={{ color: MUTED }}>
                Check your inbox: your personal {SUBSCRIBER_DISCOUNT_PERCENT}% off code is on its way,
                ready for launch day on {launchLabel}.
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
              className={`text-center px-1 sm:px-2 pt-5 [@media(max-height:700px)]:pt-3.5`}
            >
              <motion.p custom={2} variants={rise} initial="hidden" animate="show"
                className="text-[11px] tracking-[0.2em] uppercase font-medium" style={{ color: MUTED }}>
                A New Chapter Begins
              </motion.p>

              <motion.h2 custom={3} variants={rise} initial="hidden" animate="show"
                className={`mt-2 text-[27px] sm:text-[30px] [@media(max-height:700px)]:text-[24px] leading-[1.12] font-semibold tracking-[-0.015em] text-balance`}
              >
                Something Worth Waiting For.
              </motion.h2>

              <motion.p custom={4} variants={rise} initial="hidden" animate="show"
                className={`mt-3 [@media(max-height:700px)]:mt-2 text-[14.5px] [@media(max-height:700px)]:text-[13.5px] leading-relaxed text-pretty`}
                style={{ color: MUTED }}
              >
                Be among the first to experience the new Taylor Vade, launching {launchLabel}.
                Join our early access list and get{" "}
                <span className="font-semibold" style={{ color: INK }}>{SUBSCRIBER_DISCOUNT_PERCENT}% off</span> your first order.
              </motion.p>

              <motion.form custom={5} variants={rise} initial="hidden" animate="show"
                onSubmit={submit} className={`mt-5 [@media(max-height:700px)]:mt-3.5 space-y-2.5`}
              >
                <label htmlFor="launch-email" className="sr-only">Email address</label>
                <input
                  ref={inputRef}
                  id="launch-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
                  placeholder="Your email address"
                  className={`w-full rounded-[12px] bg-white px-4 py-3.5 [@media(max-height:700px)]:py-3 text-[15px] text-center outline-none
                    border border-black/10 focus:border-black/50 transition-colors placeholder:text-black/35`}
                  style={{ color: INK }}
                />
                <button
                  type="submit"
                  disabled={state === "busy"}
                  className={`w-full rounded-[12px] py-3.5 [@media(max-height:700px)]:py-3 text-[13.5px] tracking-[0.14em] uppercase font-semibold
                    flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60`}
                  style={{ background: INK, color: PAPER }}
                >
                  {state === "busy" ? <Loader2 size={16} className="animate-spin" /> : "Join the waitlist"}
                </button>
                {state === "error" && (
                  <p className="text-[12.5px] text-red-600" role="alert">{msg}</p>
                )}
              </motion.form>

              <motion.p custom={6} variants={rise} initial="hidden" animate="show"
                className={`mt-3.5 [@media(max-height:700px)]:mt-2.5 text-[12px]`} style={{ color: MUTED }}>
                Early access. First releases. {SUBSCRIBER_DISCOUNT_PERCENT}% off.
              </motion.p>
              <motion.p custom={7} variants={rise} initial="hidden" animate="show"
                className="mt-1 pb-1 text-[11px]" style={{ color: MUTED, opacity: 0.75 }}>
                By joining you agree to our{" "}
                <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
