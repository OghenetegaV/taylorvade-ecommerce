"use client";
import { usePathname } from "next/navigation";
import Footer from "./Footer";

const HIDDEN_ON = ["/admin", "/login", "/register", "/reset-password", "/update-password", "/checkout"];

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDDEN_ON.some(p => pathname.startsWith(p))) return null;
  return <Footer />;
}
