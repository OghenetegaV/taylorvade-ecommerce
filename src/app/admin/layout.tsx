// src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

async function getAdminProfile() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { fullName: true, email: true, role: true },
  });
  return profile?.role === "ADMIN" ? profile : null;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getAdminProfile();
  if (!profile) redirect("/login?redirect=/admin");

  const nav = [
    { href: "/admin",           label: "Dashboard", icon: "◈" },
    { href: "/admin/orders",    label: "Orders",    icon: "◻" },
    { href: "/admin/inventory", label: "Inventory", icon: "▣" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5f2] flex font-serif">
      <aside className="w-52 flex-shrink-0 bg-[#1a1008] flex flex-col">
        <div className="px-6 py-6 border-b border-[#ffffff15]">
          <p className="text-[9px] tracking-[0.3em] text-[#6a5a4a] uppercase mb-1">Admin Panel</p>
          <p
            className="text-[17px] text-[#f7f5f2]"
            style={{ fontFamily: "var(--font-script), cursive" }}
          >
            Taylor Vade
          </p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-[11px]
                tracking-[0.08em] text-[#c8b8a8] hover:text-[#f7f5f2]
                hover:bg-[#ffffff10] transition-colors"
            >
              <span className="opacity-60">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-5 border-t border-[#ffffff15]">
          <p className="text-[10px] text-[#6a5a4a] truncate">{profile.email}</p>
          <Link
            href="/"
            className="text-[10px] text-[#8a7a6a] hover:text-[#f7f5f2] transition-colors mt-1 block"
          >
            ← Back to store
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
