// src/app/checkout/confirm/page.tsx
// Landing page after the hosted payment page redirects back.
// Verifies server-side, fires the GA4 purchase event, then routes to success.

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { sendGAEvent } from "@next/third-parties/google";

function ConfirmInner() {
  const router = useRouter();
  const params = useSearchParams();
  const ran = useRef(false);
  const [status, setStatus] = useState<"verifying" | "failed">("verifying");
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Paystack returns ?reference=, Flutterwave returns ?tx_ref= — we set both to the order id
    const reference = params.get("reference") ?? params.get("tx_ref");
    if (!reference) { setStatus("failed"); setMessage("Missing payment reference."); return; }

    (async () => {
      try {
        const r = await fetch(`/api/checkout/verify?reference=${encodeURIComponent(reference)}`);
        const d = await r.json();

        if (d.success && d.data?.status === "PAID") {
          sendGAEvent("event", "purchase", {
            transaction_id: d.data.orderId,
            currency: d.data.currency,
            value: d.data.total,
            items: d.data.items.map((i: { name: string; quantity: number; price: number }) => ({
              item_name: i.name, quantity: i.quantity, price: i.price,
            })),
          });
          router.replace(`/checkout/success?order=${d.data.orderId}`);
        } else {
          setStatus("failed");
          setMessage(d.error ?? "Your payment could not be confirmed.");
        }
      } catch {
        setStatus("failed");
        setMessage("We couldn't reach the server. If you were charged, your order will still be confirmed — check your email or contact us.");
      }
    })();
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6 font-serif">
      <div className="text-center max-w-sm">
        {status === "verifying" ? (
          <>
            <p className="text-[28px] text-[#111] mb-3" style={{ fontFamily: "var(--font-script), cursive" }}>
              One moment
            </p>
            <p className="text-[12.5px] text-[#8f8f8a] leading-relaxed">{message}</p>
            <div className="mt-8 mx-auto w-8 h-[1px] bg-[#111] animate-pulse" />
          </>
        ) : (
          <>
            <p className="text-[28px] text-[#111] mb-3" style={{ fontFamily: "var(--font-script), cursive" }}>
              Payment not completed
            </p>
            <p className="text-[12.5px] text-[#8f8f8a] leading-relaxed mb-7">{message}</p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/checkout"
                className="bg-[#111] text-white text-[11px] tracking-[0.22em] uppercase px-7 py-3.5 hover:bg-black transition-colors">
                Try Again
              </Link>
              <Link href="/"
                className="text-[11px] tracking-[0.15em] uppercase text-[#8f8f8a] underline underline-offset-4 hover:text-[#111]">
                Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <ConfirmInner />
    </Suspense>
  );
}
