// src/app/account/page.tsx — Server Component (reads from DB directly)

import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import LogoutButton from "./LogoutButton";

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-amber-100 text-amber-800",
  PAID:       "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED:    "bg-indigo-100 text-indigo-800",
  DELIVERED:  "bg-green-100 text-green-800",
  CANCELLED:  "bg-red-100 text-red-800",
};

function fmt(n: number, cur: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: cur, minimumFractionDigits: 0 }).format(n);
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, recentOrders] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { fullName: true, email: true, phone: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { profileId: user.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, status: true, totalAmount: true, currency: true, createdAt: true,
        items: { select: { id: true } },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#f7f5f2] font-serif">
      <div className="max-w-2xl mx-auto px-5 py-12">

        <div className="flex items-start justify-between mb-10">
          <div>
            <Link href="/" className="text-[10px] tracking-[0.15em] text-[#8a7a6a] hover:text-[#1a1008] transition-colors">
              ← Taylor Vade
            </Link>
            <h1 className="text-[30px] text-[#1a1008] mt-2" style={{ fontFamily: "var(--font-script), cursive" }}>
              My Account
            </h1>
          </div>
          <LogoutButton />
        </div>

        {/* Profile */}
        <div className="bg-white border border-[#e8e2db] p-6 mb-4">
          <h2 className="text-[10px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-4">Profile</h2>
          <div className="grid grid-cols-2 gap-4 text-[12px]">
            <div>
              <p className="text-[10px] tracking-[0.1em] text-[#8a7a6a] uppercase mb-1">Name</p>
              <p className="text-[#1a1008]">{profile?.fullName ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.1em] text-[#8a7a6a] uppercase mb-1">Email</p>
              <p className="text-[#1a1008]">{profile?.email}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.1em] text-[#8a7a6a] uppercase mb-1">Phone</p>
              <p className="text-[#1a1008]">{profile?.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.1em] text-[#8a7a6a] uppercase mb-1">Member Since</p>
              <p className="text-[#1a1008]">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { href: "/account/orders",    label: "Order History",    desc: "View and track your orders" },
            { href: "/account/addresses", label: "Saved Addresses",  desc: "Manage delivery addresses" },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="bg-white border border-[#e8e2db] p-5 hover:border-[#1a1008] transition-colors group">
              <p className="text-[12px] tracking-[0.06em] text-[#1a1008] group-hover:underline underline-offset-2">{item.label}</p>
              <p className="text-[10.5px] text-[#8a7a6a] mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div className="bg-white border border-[#e8e2db]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e2db]">
            <h2 className="text-[10px] tracking-[0.2em] text-[#8a7a6a] uppercase">Recent Orders</h2>
            <Link href="/account/orders" className="text-[10px] text-[#8a7a6a] hover:text-[#1a1008] underline underline-offset-2 transition-colors">View all</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[12px] text-[#8a7a6a] tracking-wide mb-4">No orders yet.</p>
              <Link href="/" className="inline-block border border-[#1a1008] px-6 py-2.5 text-[10.5px] tracking-[0.15em] uppercase text-[#1a1008] hover:bg-[#1a1008] hover:text-white transition-colors">
                Start Shopping
              </Link>
            </div>
          ) : (
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-[#faf9f7]">
                  {["Order", "Date", "Items", "Total", "Status"].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-[10px] tracking-[0.15em] text-[#8a7a6a] uppercase font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-t border-[#f0eeeb] hover:bg-[#faf9f7] transition-colors">
                    <td className="px-6 py-3 font-mono text-[#1a1008] text-[11px]">#{order.id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-3 text-[#8a7a6a]">{new Date(order.createdAt).toLocaleDateString("en-GB")}</td>
                    <td className="px-6 py-3 text-[#8a7a6a]">{order.items.length}</td>
                    <td className="px-6 py-3 text-[#1a1008]">{fmt(Number(order.totalAmount), order.currency)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
