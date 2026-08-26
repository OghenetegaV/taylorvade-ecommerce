// src/lib/currency.ts
// Display-only currency conversion. All prices are stored/charged in NGN —
// this only affects what shoppers see while browsing, matching the "region"
// currency picker in Header.tsx.

"use client";

import { useEffect, useState } from "react";

export const CURRENCY_CHANGE_EVENT = "tv:currency";

export function formatConverted(
  ngnAmount: number,
  currency: string,
  rates: Record<string, number> | null,
): string {
  if (!rates || currency === "NGN" || !Number.isFinite(rates[currency])) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency", currency: "NGN", minimumFractionDigits: 0,
    }).format(ngnAmount);
  }
  const converted = ngnAmount * rates[currency];
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency", currency, minimumFractionDigits: 0,
    }).format(converted);
  } catch {
    return `${currency} ${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
}

export function useCurrency() {
  const [currency, setCurrency] = useState("NGN");
  const [rates, setRates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("tv_currency");
    if (stored) setCurrency(stored);

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setCurrency(detail);
    };
    window.addEventListener(CURRENCY_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CURRENCY_CHANGE_EVENT, onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/currency/rates")
      .then(r => r.json())
      .then(d => { if (!cancelled && d.success) setRates(d.data.rates); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return {
    currency,
    rates,
    format: (ngnAmount: number) => formatConverted(ngnAmount, currency, rates),
  };
}
