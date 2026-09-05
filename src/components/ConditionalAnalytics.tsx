"use client";

// Only loads gtag.js once the shopper has actually accepted the cookie
// banner — previously GoogleAnalytics always loaded regardless of the
// Accept/Decline choice, which made Decline a no-op.

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getCookieConsent, COOKIE_CONSENT_EVENT } from "@/lib/cookieConsent";

export default function ConditionalAnalytics({ gaId }: { gaId: string }) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const sync = () => setAccepted(getCookieConsent() === "accepted");
    sync();
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync);
  }, []);

  if (!accepted) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
