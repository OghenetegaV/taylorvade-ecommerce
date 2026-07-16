// src/app/admin/AdminShell.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Boxes,
  Store, Menu, X, ChevronRight, Sparkles,
} from "lucide-react";

type Profile = { fullName: string | null; email: string; role: string };

const NAV = [
  { href: "/admin",           label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products",  label: "Products",  icon: Package         },
  { href: "/admin/orders",    label: "Orders",    icon: ShoppingCart    },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes           },
];

function Sidebar({ profile, onClose }: { profile: Profile; onClose?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const initials = (profile.fullName ?? profile.email)
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600
              flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-tight">Taylor Vade</p>
              <p className="text-slate-400 text-[10px] tracking-wide">Admin Console</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-500 tracking-widest uppercase px-3 mb-2">
          Main Menu
        </p>
        {NAV.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 group ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-blue-200" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/8 pt-3 space-y-0.5">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-slate-400 hover:text-white hover:bg-white/8 transition-all"
        >
          <Store className="w-4 h-4 text-slate-500" />
          View Store
        </Link>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600
            flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate">
              {profile.fullName ?? "Admin"}
            </p>
            <p className="text-slate-500 text-[10px] truncate">{profile.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({
  children, profile,
}: { children: React.ReactNode; profile: Profile }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Page title from route
  const pageTitle =
    pathname === "/admin"              ? "Dashboard"  :
    pathname.startsWith("/admin/products") && pathname.includes("/edit") ? "Edit Product" :
    pathname.startsWith("/admin/products/new")  ? "New Product"  :
    pathname.startsWith("/admin/products")      ? "Products"     :
    pathname.startsWith("/admin/orders")        ? "Orders"       :
    pathname.startsWith("/admin/inventory")     ? "Inventory"    : "Admin";

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[220px] flex-shrink-0 flex-col fixed top-0 left-0 h-full z-30 shadow-xl shadow-slate-900/20">
        <Sidebar profile={profile} />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed top-0 left-0 h-full w-[220px] z-50 shadow-2xl
        transform transition-transform duration-300 ease-in-out lg:hidden ${
        open ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar profile={profile} onClose={() => setOpen(false)} />
      </aside>

      {/* Content area */}
      <div className="flex-1 flex flex-col lg:ml-[220px]">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3.5
          flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900">{pageTitle}</h1>
              <p className="text-xs text-slate-500 hidden md:block">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/products/new"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-sm
                shadow-blue-500/25">
              <Package className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
