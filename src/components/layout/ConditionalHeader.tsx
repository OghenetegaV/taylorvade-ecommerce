// src/components/layout/ConditionalHeader.tsx
// UPDATED: /checkout removed — checkout now uses the main site Header.

"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

const HIDDEN_ON = [
  "/admin",
  "/admin-login",
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
];

export default function ConditionalHeader() {
  const pathname = usePathname();
  const hide = HIDDEN_ON.some(path => pathname.startsWith(path));
  if (hide) return null;
  return <Header />;
}
