// src/components/layout/LaunchConcierge.tsx
// Floating "concierge" pill, bottom-left of every store page, linking to the
// /launch signup page. Hidden once the visitor subscribes; the small × hides
// it for the rest of the visit.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { SUBSCRIBER_DISCOUNT_PERCENT } from "@/lib/subscriberOffer";
import { SUBSCRIBED_KEY } from "./LaunchPopup";

const HIDDEN_KEY = "tv_concierge_hidden"; // sessionStorage
const SHOW_AFTER_MS = 1800;

const CREAM = "#f3ede4";
const INK   = "#15110e";
const TAN   = "#c9a77c";

function isSubscribed() {
  try { return !!localStorage.getItem(SUBSCRIBED_KEY); } catch { return false; }
}

export default function LaunchConcierge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hidden = false;
    try { hidden = !!sessionStorage.getItem(HIDDEN_KEY); } catch {}
    if (hidden || isSubscribed()) return;
    const t = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    const onSub = () => setVisible(false);
    window.addEventListener("tv:subscribed", onSub);
    return () => { clearTimeout(t); window.removeEventListener("tv:subscribed", onSub); };
  }, []);

  function hide() {
    try { sessionStorage.setItem(HIDDEN_KEY, "1"); } catch {}
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="concierge"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-30 left-3 bottom-3 md:left-6 md:bottom-6 flex items-stretch
            shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          style={{ background: INK, color: CREAM, border: `1px solid ${TAN}66` }}
        >
          <Link
            href="/launch"
            className="group flex items-center gap-3 pl-4 pr-3 py-3 md:pl-5 md:pr-4 md:py-3.5"
            aria-label={`The New Collection — sign up for early access and ${SUBSCRIBER_DISCOUNT_PERCENT}% off`}
          >
            <span className="relative flex w-2 h-2 shrink-0">
              <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: TAN }} />
              <span className="relative w-2 h-2 rounded-full" style={{ background: TAN }} />
            </span>
            <span className="flex flex-col leading-tight text-left">
              <span className="text-[9.5px] md:text-[10px] tracking-[0.32em] uppercase font-serif" style={{ color: TAN }}>
                The New Collection
              </span>
              <span className="text-[13px] md:text-[14px] font-serif mt-0.5">
                Early access + {SUBSCRIBER_DISCOUNT_PERCENT}% off
              </span>
            </span>
            <ArrowRight size={15} strokeWidth={1.5}
              className="ml-1 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <button
            onClick={hide}
            aria-label="Hide"
            className="px-2.5 border-l flex items-center hover:bg-white/5 transition-colors"
            style={{ borderColor: `${CREAM}1f` }}
          >
            <X size={13} strokeWidth={1.4} style={{ color: `${CREAM}99` }} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
