// src/app/checkout/success/page.tsx

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessInner() {
  const params  = useSearchParams();
  const orderId = params.get("order");

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6 font-serif">
      <div className="text-center max-w-md">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#8f8f8a] mb-4">Order Confirmed</p>
        <p className="text-[38px] leading-tight text-[#111] mb-5"
          style={{ fontFamily: "var(--font-script), cursive" }}>
          Thank you
        </p>
        <p className="text-[12.5px] text-[#555] leading-relaxed mb-2">
          Your order has been placed and a confirmation email is on its way.
        </p>
        {orderId && (
          <p className="text-[11px] tracking-[0.12em] text-[#8f8f8a] mb-8">
            Order&nbsp;#{orderId.slice(-8).toUpperCase()}
          </p>
        )}
        <div className="flex items-center justify-center gap-5">
          <Link href="/account"
            className="bg-[#111] text-white text-[11px] tracking-[0.22em] uppercase px-7 py-3.5 hover:bg-black transition-colors">
            View My Orders
          </Link>
          <Link href="/collections/woman"
            className="text-[11px] tracking-[0.15em] uppercase text-[#111] underline underline-offset-4 hover:opacity-60 transition-opacity">
            Keep Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <SuccessInner />
    </Suspense>
  );
}
