// src/components/layout/NewsletterDrawer.tsx
// Auto-shows after 5s on first visit (respects 30-day dismiss + permanent subscribe flag)

"use client";

import { useState, useEffect, useTransition } from "react";
import { X } from "lucide-react";

const STORAGE_KEY    = "tv_newsletter_dismissed";
const SUBSCRIBED_KEY = "tv_newsletter_subscribed";
const DISMISS_DAYS   = 30;

type Category = "Woman" | "Man" | "All";

export default function NewsletterDrawer() {
  const [visible,   setVisible]   = useState(false);
  const [open,      setOpen]      = useState(false);
  const [email,     setEmail]     = useState("");
  const [cats,      setCats]      = useState<Category[]>([]);
  const [smsOptIn,  setSmsOptIn]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Don't show if already subscribed
    if (localStorage.getItem(SUBSCRIBED_KEY)) return;

    // Don't show if dismissed recently
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const days = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (days < DISMISS_DAYS) return;
    }

    // Show after 5 seconds
    const timer = setTimeout(() => {
      setVisible(true);
      // Small extra delay for the slide animation to feel intentional
      setTimeout(() => setOpen(true), 60);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  function handleDismiss() {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setTimeout(() => setVisible(false), 400);
  }

  function toggleCat(cat: Category) {
    setCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res  = await fetch("/api/newsletter/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, categories: cats, smsOptIn }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setSuccess(true);
      localStorage.setItem(SUBSCRIBED_KEY, "true");
      // Close after showing success for 2.5s
      setTimeout(() => {
        setOpen(false);
        setTimeout(() => setVisible(false), 400);
      }, 2500);
    });
  }

  if (!visible) return null;

  const CheckboxRow = ({
    id, label, checked, onChange,
  }: { id: string; label: string; checked: boolean; onChange: () => void }) => (
    <label
      htmlFor={id}
      className="flex items-center gap-2.5 cursor-pointer group"
    >
      <span className={`w-[14px] h-[14px] flex-shrink-0 border transition-colors ${
        checked ? "bg-[#3a2e22] border-[#3a2e22]" : "border-[#3a2e22] group-hover:border-[#3a2e22]"
      } flex items-center justify-center`}>
        {checked && (
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#FAF9F7" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className="text-[11px] tracking-[0.06em] text-[#3a2e22] font-serif">{label}</span>
    </label>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        className={`fixed inset-0 z-[150] bg-black/50 transition-opacity duration-400 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel — right side, full height, matches Manière De Voir layout */}
      <div className={`fixed top-0 right-0 h-full w-[340px] max-w-[90vw] z-[160]
        bg-[#FAF9F7] flex flex-col
        transition-transform duration-400 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ boxShadow: "-8px 0 40px rgba(58,46,34,0.12)" }}
      >
        {/* Close */}
        <button
          onClick={handleDismiss}
          aria-label="Close newsletter"
          className="absolute top-4 right-4 text-[#3a2e22] hover:opacity-50 transition-opacity"
        >
          <X size={16} strokeWidth={1.3} />
        </button>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-10 py-12">

          {success ? (
            /* ── Success state ── */
            <div className="text-center">
              <p className="text-[22px] text-[#3a2e22] font-serif mb-3"
                style={{ fontFamily: "var(--font-script), cursive" }}>
                Thank you
              </p>
              <p className="text-[11px] tracking-[0.1em] text-[#3a2e22] font-serif leading-relaxed">
                You&apos;re on the list.
              </p>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <h2 className="text-[13px] tracking-[0.2em] text-[#3a2e22] font-serif uppercase mb-1.5">
                Newsletter
              </h2>
              <p className="text-[11px] tracking-[0.06em] text-[#3a2e22] font-serif mb-7">
                Sign up to Our Newsletter
              </p>

              <form onSubmit={handleSubmit}>

                {/* Category checkboxes */}
                <div className="flex items-center gap-5 mb-7">
                  {(["Woman", "Man", "All"] as Category[]).map(cat => (
                    <CheckboxRow
                      key={cat}
                      id={`cat-${cat}`}
                      label={cat}
                      checked={cats.includes(cat)}
                      onChange={() => toggleCat(cat)}
                    />
                  ))}
                </div>

                {/* Email input */}
                <div className="mb-6">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email Address"
                    required
                    className="w-full border-b border-[#3a2e22] bg-transparent pb-2
                      text-[11px] tracking-[0.08em] text-[#3a2e22] font-serif
                      placeholder:text-[#9a8a7a] outline-none
                      focus:border-[#1a1008] transition-colors"
                  />
                </div>

                {/* Get updates by */}
                <p className="text-[10px] tracking-[0.12em] text-[#3a2e22] font-serif uppercase mb-3">
                  Get Updates By:
                </p>
                <div className="space-y-2.5 mb-7">
                  <CheckboxRow
                    id="ch-email"
                    label="Email"
                    checked={true}
                    onChange={() => {}}
                  />
                  <CheckboxRow
                    id="ch-sms"
                    label="SMS (Optional)"
                    checked={smsOptIn}
                    onChange={() => setSmsOptIn(v => !v)}
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-[10.5px] text-red-600 font-serif tracking-wide mb-3">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full border border-[#3a2e22] bg-transparent py-3
                    text-[10.5px] tracking-[0.2em] text-[#3a2e22] font-serif uppercase
                    hover:bg-[#3a2e22] hover:text-[#FAF9F7] transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Signing up…" : "Sign Up"}
                </button>

                {/* Privacy */}
                <p className="text-center mt-4">
                  <a
                    href="/privacy"
                    className="text-[9.5px] tracking-[0.08em] text-[#9a8a7a] font-serif
                      underline underline-offset-2 hover:text-[#3a2e22] transition-colors"
                  >
                    Privacy Policy
                  </a>
                </p>

              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
