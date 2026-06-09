// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import dynamic from "next/dynamic";

// Lazy-load the map (avoids SSR issues with react-simple-maps)
const OrderMap = dynamic(() => import("@/components/admin/OrderMap"), { ssr: false, loading: () => (
  <div className="h-[320px] flex items-center justify-center text-[11px] tracking-widest text-[#8a7a6a]">
    Loading map…
  </div>
)});

// ── Types ──────────────────────────────────────────────────────────────
type Stats = {
  orders:   { total: number; today: number; thisWeek: number; thisMonth: number; pending: number; processing: number; shipped: number };
  revenue:  { allTime: number; thisMonth: number; today: number };
  customers: number;
  inventory: { lowStock: number; outOfStock: number };
  recentOrders: any[];
};
type Analytics = {
  revenueByDay: { date: string; revenue: number }[];
  ordersByDay:  { date: string; orders:  number }[];
  byCountry:    { country: string; count: number }[];
  byStatus:     { status: string; count: number }[];
  topProducts:  { name: string; qty: number; revenue: number }[];
};

// ── Constants ──────────────────────────────────────────────────────────
const PIE_COLORS: Record<string, string> = {
  PENDING:    "#F59E0B",
  PAID:       "#3B82F6",
  PROCESSING: "#8B5CF6",
  SHIPPED:    "#6366F1",
  DELIVERED:  "#10B981",
  CANCELLED:  "#EF4444",
  REFUNDED:   "#9CA3AF",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-amber-100 text-amber-800",
  PAID:       "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED:    "bg-indigo-100 text-indigo-800",
  DELIVERED:  "bg-green-100 text-green-800",
  CANCELLED:  "bg-red-100 text-red-800",
};

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}
function fmtFull(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}
function shortDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── KPI Card ────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, trend, warn, href
}: { label: string; value: string | number; sub?: string; trend?: string; warn?: boolean; href?: string }) {
  const inner = (
    <div className={`p-5 rounded-lg border h-full transition-shadow hover:shadow-md ${
      warn ? "border-amber-200 bg-amber-50" : "border-[#e8e2db] bg-white"
    }`}>
      <p className="text-[10px] tracking-[0.18em] text-[#8a7a6a] uppercase mb-2 font-serif">{label}</p>
      <p className={`text-[26px] font-light leading-none ${warn ? "text-amber-700" : "text-[#1a1008]"}`}>
        {value}
      </p>
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-1.5">
          {sub   && <p className="text-[10px] text-[#8a7a6a]">{sub}</p>}
          {trend && <p className={`text-[10px] font-medium ${trend.startsWith("+") ? "text-green-600" : "text-red-500"}`}>{trend}</p>}
        </div>
      )}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

// ── Chart card wrapper ─────────────────────────────────────────────────
function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#e8e2db] rounded-lg p-5 ${className}`}>
      <p className="text-[11px] tracking-[0.15em] text-[#8a7a6a] uppercase font-serif mb-4">{title}</p>
      {children}
    </div>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e8e2db] rounded px-3 py-2 shadow-lg text-[11px] font-serif">
      <p className="text-[#8a7a6a] mb-0.5">{shortDate(label)}</p>
      <p className="text-[#1a1008] font-medium">{fmtFull(payload[0].value)}</p>
    </div>
  );
};

const OrdersTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e8e2db] rounded px-3 py-2 shadow-lg text-[11px] font-serif">
      <p className="text-[#8a7a6a] mb-0.5">{shortDate(label)}</p>
      <p className="text-[#1a1008] font-medium">{payload[0].value} orders</p>
    </div>
  );
};

// ── Main dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/dashboard").then(r => r.json()),
      fetch("/api/admin/analytics").then(r => r.json()),
    ]).then(([s, a]) => {
      if (s.success) setStats(s.data);
      if (a.success) setAnalytics(a.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[11px] tracking-widest text-[#8a7a6a] font-serif">
      Loading…
    </div>
  );
  if (!stats) return (
    <div className="p-8 text-[11px] text-red-500 font-serif">Failed to load dashboard.</div>
  );

  return (
    <div className="p-4 md:p-8 font-serif space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] md:text-[24px] text-[#1a1008] tracking-wide">Dashboard</h1>
          <p className="text-[10px] tracking-[0.1em] text-[#8a7a6a] mt-0.5">
            {new Date().toLocaleDateString("en-GB", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </p>
        </div>
        <Link href="/admin/products/new"
          className="bg-[#1a1008] text-white text-[10.5px] tracking-[0.15em] uppercase px-4 py-2.5
            hover:bg-[#3a2e22] transition-colors hidden md:block">
          + Add Product
        </Link>
      </div>

      {/* KPI cards — 2 cols mobile, 3 cols tablet, 6 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Today's Revenue"  value={fmt(stats.revenue.today)} />
        <KpiCard label="Monthly Revenue"  value={fmt(stats.revenue.thisMonth)} />
        <KpiCard label="Total Revenue"    value={fmt(stats.revenue.allTime)} />
        <KpiCard label="Orders Today"     value={stats.orders.today} />
        <KpiCard label="Total Customers"  value={stats.customers} />
        <KpiCard label="Pending"          value={stats.orders.pending}
          sub="awaiting payment" warn={stats.orders.pending > 0} />
      </div>

      {/* Second row KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Processing"   value={stats.orders.processing} sub="being packed" />
        <KpiCard label="Shipped"      value={stats.orders.shipped}    sub="in transit" />
        <KpiCard label="Low Stock"    value={stats.inventory.lowStock}    warn={stats.inventory.lowStock > 0}
          sub="≤ 5 units" href="/admin/inventory?filter=low" />
        <KpiCard label="Out of Stock" value={stats.inventory.outOfStock} warn={stats.inventory.outOfStock > 0}
          sub="0 units" href="/admin/inventory?filter=out" />
      </div>

      {/* Charts row 1: Revenue + Order status */}
      {analytics && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard title="Revenue — Last 30 Days" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={analytics.revenueByDay} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1a1008" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#1a1008" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: "#8a7a6a" }}
                    interval={6} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10, fill: "#8a7a6a" }}
                    tickLine={false} axisLine={false} width={60} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#1a1008" strokeWidth={1.5}
                    fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Order Status">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={analytics.byStatus} dataKey="count" nameKey="status"
                    cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                    {analytics.byStatus.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[entry.status] ?? "#9CA3AF"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [value, name]}
                    contentStyle={{ fontSize: 11, fontFamily: "Georgia, serif", border: "1px solid #e8e2db" }}
                  />
                  <Legend
                    iconType="circle" iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: 10, color: "#8a7a6a", fontFamily: "Georgia, serif" }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Charts row 2: Daily orders + Top products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard title="Orders — Last 30 Days" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.ordersByDay} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: "#8a7a6a" }}
                    interval={6} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#8a7a6a" }} tickLine={false} axisLine={false}
                    allowDecimals={false} width={28} />
                  <Tooltip content={<OrdersTooltip />} />
                  <Bar dataKey="orders" fill="#3a2e22" radius={[2, 2, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top Products (30d)">
              {analytics.topProducts.length === 0 ? (
                <p className="text-[11px] text-[#8a7a6a] text-center py-8">No sales yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics.topProducts.map((p, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11.5px] text-[#1a1008] truncate flex-1 mr-2">{p.name}</p>
                        <p className="text-[10.5px] text-[#8a7a6a] flex-shrink-0">{p.qty} sold</p>
                      </div>
                      <div className="h-1.5 bg-[#f0eeeb] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1a1008] rounded-full transition-all"
                          style={{
                            width: `${(p.revenue / analytics.topProducts[0].revenue) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-[#8a7a6a] mt-0.5">{fmtFull(p.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>

          {/* Map + Country breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard title="Order Locations" className="lg:col-span-2">
              <OrderMap data={analytics.byCountry} />
            </ChartCard>

            <ChartCard title="Orders by Country">
              {analytics.byCountry.length === 0 ? (
                <p className="text-[11px] text-[#8a7a6a] text-center py-8">No location data</p>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[320px]">
                  {analytics.byCountry.map((c, i) => {
                    const max = analytics.byCountry[0].count;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[11.5px] text-[#1a1008] truncate flex-1 mr-2">{c.country}</p>
                          <p className="text-[10.5px] text-[#8a7a6a] flex-shrink-0">{c.count}</p>
                        </div>
                        <div className="h-1 bg-[#f0eeeb] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#3a2e22] rounded-full"
                            style={{ width: `${(c.count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] tracking-[0.2em] text-[#8a7a6a] uppercase">Recent Orders</h2>
          <Link href="/admin/orders" className="text-[10px] text-[#8a7a6a] hover:text-[#1a1008] underline underline-offset-2">
            View all
          </Link>
        </div>
        <div className="bg-white border border-[#e8e2db] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px] min-w-[600px]">
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
                {stats.recentOrders.map((o: any) => (
                  <tr key={o.id} className="border-b border-[#f0eeeb] hover:bg-[#faf9f7] transition-colors">
                    <td className="px-4 py-3 font-mono text-[#1a1008] text-[11px]">
                      #{o.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#1a1008]">{o.profile.fullName ?? "—"}</p>
                      <p className="text-[10px] text-[#8a7a6a]">{o.address?.city}</p>
                    </td>
                    <td className="px-4 py-3 text-[#8a7a6a]">{o.items.length}</td>
                    <td className="px-4 py-3 text-[#1a1008]">{fmtFull(Number(o.totalAmount))}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8a7a6a] whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stats.recentOrders.length === 0 && (
            <p className="text-center py-12 text-[11px] tracking-widest text-[#8a7a6a]">No orders yet</p>
          )}
        </div>
      </div>

      {/* Mobile add product button */}
      <Link href="/admin/products/new"
        className="fixed bottom-6 right-6 bg-[#1a1008] text-white text-[11px] tracking-[0.1em]
          uppercase px-5 py-3 shadow-lg md:hidden">
        + Add Product
      </Link>
    </div>
  );
}
