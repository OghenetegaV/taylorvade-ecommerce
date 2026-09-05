// src/lib/cookieConsent.ts
// Shared constants for the footer's cookie-consent banner and whatever reads
// its decision (currently: whether analytics is allowed to load).

export const COOKIE_CONSENT_KEY = "tv_cookie_consent";
export const COOKIE_CONSENT_EVENT = "cookieConsentChanged";

export type CookieConsent = "accepted" | "declined";

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  return value === "accepted" || value === "declined" ? value : null;
}

export function setCookieConsent(value: CookieConsent) {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }));
}
