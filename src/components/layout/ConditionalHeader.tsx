// src/components/layout/ConditionalHeader.tsx
// Renders the store Header on store pages only — mirrors ConditionalFooter.

"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

const HIDDEN_ON = [
  "/admin",        // admin panel has its own chrome (AdminShell)
  "/admin-login",
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
  "/checkout",     // checkout renders its own slim header
];

export default function ConditionalHeader() {
  const pathname = usePathname();
  const hide = HIDDEN_ON.some(path => pathname.startsWith(path));
  if (hide) return null;
  return <Header />;
}
