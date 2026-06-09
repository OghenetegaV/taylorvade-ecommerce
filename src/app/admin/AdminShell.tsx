// src/app/admin/AdminShell.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Profile = { fullName: string | null; email: string; role: string };

const NAV = [
  { href: "/admin",             label: "Dashboard", icon: "◈" },
  { href: "/admin/products",    label: "Products",  icon: "◻" },
  { href: "/admin/orders",      label: "Orders",    icon: "≡" },
  { href: "/admin/inventory",   label: "Inventory", icon: "▣" },
];

export default function AdminShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#ffffff15]">
        <p className="text-[9px] tracking-[0.3em] text-[#6a5a4a] uppercase mb-0.5">Admin</p>
        <p
          className="text-[20px] text-[#f7f5f2] leading-tight"
          style={{ fontFamily: "var(--font-script), cursive" }}
        >
          Taylor Vade
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-[11px]
              tracking-[0.08em] transition-colors ${
              isActive(item.href)
                ? "bg-[#ffffff18] text-[#f7f5f2]"
                : "text-[#c8b8a8] hover:text-[#f7f5f2] hover:bg-[#ffffff10]"
            }`}
          >
            <span className="opacity-60 w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#ffffff15] space-y-1">
        <p className="text-[10px] text-[#6a5a4a] truncate">{profile.email}</p>
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="text-[10px] text-[#8a7a6a] hover:text-[#f7f5f2] transition-colors block"
        >
          ← Back to store
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f7f5f2] font-serif flex">

      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:flex w-52 flex-shrink-0 bg-[#1a1008] flex-col fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#1a1008] flex flex-col z-50
        transform transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ffffff15]">
          <p className="text-[18px] text-[#f7f5f2]" style={{ fontFamily: "var(--font-script), cursive" }}>
            Taylor Vade
          </p>
          <button onClick={() => setOpen(false)} className="text-[#8a7a6a] hover:text-[#f7f5f2] text-2xl leading-none">
            ×
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded text-[12px]
                tracking-[0.08em] transition-colors ${
                isActive(item.href)
                  ? "bg-[#ffffff18] text-[#f7f5f2]"
                  : "text-[#c8b8a8] hover:text-[#f7f5f2] hover:bg-[#ffffff10]"
              }`}>
              <span className="opacity-60 w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-[#ffffff15]">
          <p className="text-[10px] text-[#6a5a4a] truncate">{profile.email}</p>
          <Link href="/" onClick={() => setOpen(false)}
            className="text-[10px] text-[#8a7a6a] hover:text-[#f7f5f2] transition-colors mt-1 block">
            ← Back to store
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-52">

        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-[#e8e2db] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col gap-1 p-1"
            aria-label="Open menu"
          >
            <span className="w-5 h-px bg-[#1a1008] block" />
            <span className="w-5 h-px bg-[#1a1008] block" />
            <span className="w-4 h-px bg-[#1a1008] block" />
          </button>
          <p className="text-[17px] text-[#1a1008]" style={{ fontFamily: "var(--font-script), cursive" }}>
            Taylor Vade
          </p>
          <Link href="/admin/products/new"
            className="text-[10px] tracking-[0.1em] uppercase bg-[#1a1008] text-white px-3 py-1.5 hover:bg-[#3a2e22] transition-colors">
            + Add
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
