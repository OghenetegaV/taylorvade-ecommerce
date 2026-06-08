// src/app/admin/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-amber-100 text-amber-800",
  PAID:       "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED:    "bg-indigo-100 text-indigo-800",
  DELIVERED:  "bg-green-100 text-green-800",
  CANCELLED:  "bg-red-100 text-red-800",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", minimumFractionDigits: 0,
  }).format(n);
}

function Card({ label, value, sub, warn, href }: {
  label: string; value: string | number; sub?: string; warn?: boolean; href?: string;
}) {
  const inner = (
    <div className={`border p-5 h-full ${warn ? "border-amber-300 bg-amber-50" : "border-[#e8e2db] bg-white"}`}>
      <p className="text-[10px] tracking-[0.15em] text-[#8a7a6a] uppercase mb-2">{label}</p>
      <p className={`text-[26px] font-light ${warn ? "text-amber-700" : "text-[#1a1008]"}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#8a7a6a] mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 text-[11px] tracking-widest text-[#8a7a6a] font-serif">Loading…</div>
  );
  if (!data) return (
    <div className="p-8 text-[11px] text-red-500 font-serif">Failed to load dashboard.</div>
  );

  return (
    <div className="p-8 font-serif">
      <div className="mb-8">
        <h1 className="text-[22px] text-[#1a1008] tracking-wide">Dashboard</h1>
        <p className="text-[11px] tracking-[0.1em] text-[#8a7a6a] mt-0.5">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card label="Revenue Today"       value={fmt(data.revenue.today)} />
        <Card label="Revenue This Month"  value={fmt(data.revenue.thisMonth)} />
        <Card label="All-Time Revenue"    value={fmt(data.revenue.allTime)} />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Card label="Orders Today"     value={data.orders.today} />
        <Card label="Orders This Week" value={data.orders.thisWeek} />
        <Card label="Pending"          value={data.orders.pending}    sub="Awaiting payment" />
        <Card label="Processing"       value={data.orders.processing} sub="Being packed" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card label="Customers"    value={data.customers} />
        <Card label="Low Stock"    value={data.inventory.lowStock}    sub="≤ 5 units"
          warn={data.inventory.lowStock > 0}    href="/admin/inventory?filter=low" />
        <Card label="Out of Stock" value={data.inventory.outOfStock} sub="0 units"
          warn={data.inventory.outOfStock > 0} href="/admin/inventory?filter=out" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[12px] tracking-[0.15em] text-[#1a1008] uppercase">Recent Orders</h2>
          <Link href="/admin/orders" className="text-[11px] text-[#8a7a6a] underline hover:text-[#1a1008]">
            View all
          </Link>
        </div>
        <div className="bg-white border border-[#e8e2db] overflow-x-auto">
          <table className="w-full text-[11.5px] min-w-[700px]">
            <thead>
              <tr className="bg-[#faf9f7] border-b border-[#e8e2db]">
                {["Order","Customer","Items","Amount","Status","Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] tracking-[0.15em] text-[#8a7a6a] uppercase font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((o: any) => (
                <tr key={o.id} className="border-b border-[#f0eeeb] hover:bg-[#faf9f7]">
                  <td className="px-4 py-3 font-mono text-[#1a1008] text-[11px]">
                    #{o.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-[#3a2e22]">
                    {o.profile.fullName ?? o.profile.email.split("@")[0]}
                  </td>
                  <td className="px-4 py-3 text-[#8a7a6a]">{o.items.length}</td>
                  <td className="px-4 py-3 text-[#1a1008]">{fmt(Number(o.totalAmount))}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS_COLORS[o.status] ?? ""}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8a7a6a]">
                    {new Date(o.createdAt).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.recentOrders.length && (
            <p className="text-center py-12 text-[11px] tracking-widest text-[#8a7a6a]">
              No orders yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
