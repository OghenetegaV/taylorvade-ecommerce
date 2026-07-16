// src/components/home/NewsletterBand.tsx
// In-page signup band — posts to the same /api/newsletter/subscribe endpoint.

"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";

export default function NewsletterBand() {
  const [email,  setEmail]  = useState("");
  const [state,  setState]  = useState<"idle"|"busy"|"done"|"error">("idle");
  const [msg,    setMsg]    = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("busy");
    try {
      const r = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, categories: ["All"], smsOptIn: false }),
      });
      const d = await r.json();
      if (d.success) {
        setState("done");
        localStorage.setItem("tv_newsletter_subscribed", "true");
      } else {
        setState("error");
        setMsg(d.error ?? "Something went wrong.");
      }
    } catch {
      setState("error");
      setMsg("Something went wrong. Try again.");
    }
  }

  return (
    <section className="bg-[#1a1008] py-16 md:py-24 px-5">
      <ScrollReveal>
        <div className="max-w-[520px] mx-auto text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase font-serif text-[#9a8a7a] mb-3">
            The inner circle
          </p>
          <h2 className="text-[#F1EFE8] leading-tight"
            style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(30px,4.5vw,46px)" }}>
            Join the Vaders
          </h2>
          <p className="text-[#8a7a6a] text-[12px] font-serif tracking-[0.04em] leading-relaxed mt-3">
            First access to drops, the films before they&apos;re public,
            and the occasional word from the cutting table.
          </p>

          {state === "done" ? (
            <p className="mt-8 text-[13px] font-serif text-[#F1EFE8]"
              style={{ fontFamily: "var(--font-script), cursive", fontSize: "22px" }}>
              You&apos;re in. Welcome.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-[420px] mx-auto">
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 bg-transparent border-b border-[#F1EFE8]/35 pb-2.5
                  text-[13px] font-serif text-[#F1EFE8] placeholder:text-[#6a5a4a]
                  outline-none focus:border-[#F1EFE8] transition-colors text-center sm:text-left"
              />
              <button
                type="submit" disabled={state === "busy"}
                className="text-[10.5px] tracking-[0.22em] uppercase font-serif text-[#F1EFE8]
                  border border-[#F1EFE8]/40 px-6 py-3 hover:bg-[#F1EFE8] hover:text-[#1a1008]
                  active:scale-[0.98] transition-all duration-300 disabled:opacity-50">
                {state === "busy" ? "Joining…" : "Join"}
              </button>
            </form>
          )}
          {state === "error" && (
            <p className="mt-3 text-[11px] font-serif text-red-400">{msg}</p>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}
