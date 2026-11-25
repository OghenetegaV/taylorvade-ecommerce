// src/components/layout/ConditionalFooter.tsx
// Renders Footer + NewsletterDrawer on store pages only.
// (/launch is the pre-launch holding page with its own full-screen layout.)

"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";
import NewsletterDrawer from "./NewsletterDrawer";

const HIDDEN_ON = [
  "/admin",
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
  "/checkout",
  "/launch",
];

export default function ConditionalFooter() {
  const pathname = usePathname();
  const hide = HIDDEN_ON.some(path => pathname.startsWith(path));
  if (hide) return null;
  return (
    <>
      <Footer />
      <NewsletterDrawer />
    </>
  );
}
