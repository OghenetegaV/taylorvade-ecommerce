// src/components/layout/ConditionalFooter.tsx
// Renders Footer + the signup popup on store pages only.
// During the New Collection campaign the LaunchPopup replaces the regular
// NewsletterDrawer (two popups at once would be too much) — swap them back
// after the December drop.

"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";
import LaunchPopup from "./LaunchPopup";

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
      <LaunchPopup />
    </>
  );
}
