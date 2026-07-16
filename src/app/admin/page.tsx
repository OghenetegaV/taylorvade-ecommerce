// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp, ShoppingBag, Users, Clock, Truck,
  AlertTriangle, PackageX, ArrowUpRight, Package,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import dynamic from "next/dynamic";

const OrderMap = dynamic(() => import("@/components/admin/OrderMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center text-sm text-slate-400">
      Loading map…
    </div>
  ),
});

// ── Types ────────────────────────────────────────────────────────────────────
type Stats = {
  orders:    { total: number; today: number; thisWeek: number; thisMonth: number; pending: number; processing: number; shipped: number };
  revenue:   { allTime: number; thisMonth: number; today: number };
  customers: number;
  inventory: { lowStock: number; outOfStock: number };
  recentOrders: any[];
};
type Analytics = {
  revenueByDay:  { date: string; revenue: number }[];
  ordersByDay:   { date: string; orders:  number }[];
  byCountry:     { country: string; count: number }[];
  byStatus:      { status: string; count: number }[];
  topProducts:   { name: string; qty: number; revenue: number }[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-amber-100 text-amber-700 border-amber-200",
  PAID:       "bg-blue-100 text-blue-700 border-blue-200",
  PROCESSING: "bg-violet-100 text-violet-700 border-violet-200",
  SHIPPED:    "bg-indigo-100 text-indigo-700 border-indigo-200",
  DELIVERED:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED:  "bg-red-100 text-red-700 border-red-200",
};
const PIE_COLORS: Record<string, string> = {
  PENDING:"#f59e0b", PAID:"#3b82f6", PROCESSING:"#8b5cf6",
  SHIPPED:"#6366f1", DELIVERED:"#10b981", CANCELLED:"#ef4444",
};

function ngn(n: number) {
  if (n >= 1_000_000) return `₦${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n/1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}
function ngnFull(n: number) {
  return new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",minimumFractionDigits:0}).format(n);
}
function shortDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, iconBg, iconColor, href, warn,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  href?: string; warn?: boolean;
}) {
  const inner = (
    <div className={`bg-white rounded-2xl p-5 border transition-all duration-200 h-full
      hover:shadow-md hover:-translate-y-0.5 cursor-default ${
      warn ? "border-amber-200 shadow-sm shadow-amber-100" : "border-slate-100 shadow-sm"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {warn && <AlertTriangle className="w-4 h-4 text-amber-500" />}
      </div>
      <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
const RevTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-slate-500 mb-0.5">{shortDate(label)}</p>
      <p className="font-bold text-slate-900">{ngnFull(payload[0].value)}</p>
    </div>
  );
};
const OrdTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-slate-500 mb-0.5">{shortDate(label)}</p>
      <p className="font-bold text-slate-900">{payload[0].value} orders</p>
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [analytics,setAnalytics]= useState<Analytics | null>(null);
  const [loading,  setLoading]  = useState(true);

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
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading dashboard…</p>
      </div>
    </div>
  );
  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-red-500">Failed to load dashboard data.</p>
    </div>
  );

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* Header greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{greeting} 👋</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Today's Revenue"   value={ngn(stats.revenue.today)}
          icon={TrendingUp} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        <KpiCard label="Monthly Revenue"   value={ngn(stats.revenue.thisMonth)}
          icon={TrendingUp} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <KpiCard label="All-Time Revenue"  value={ngn(stats.revenue.allTime)}
          icon={TrendingUp} iconBg="bg-violet-100" iconColor="text-violet-600" />
        <KpiCard label="Orders Today"      value={stats.orders.today}
          icon={ShoppingBag} iconBg="bg-indigo-100" iconColor="text-indigo-600"
          sub={`${stats.orders.thisWeek} this week`} />
        <KpiCard label="Customers"         value={stats.customers}
          icon={Users} iconBg="bg-pink-100" iconColor="text-pink-600" />
        <KpiCard label="Pending"           value={stats.orders.pending}
          icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-600"
          sub="Awaiting payment" warn={stats.orders.pending > 0} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Processing" value={stats.orders.processing}
          icon={Package} iconBg="bg-orange-100" iconColor="text-orange-600"
          sub="Being packed" />
        <KpiCard label="Shipped"    value={stats.orders.shipped}
          icon={Truck} iconBg="bg-sky-100" iconColor="text-sky-600"
          sub="In transit" />
        <KpiCard label="Low Stock"    value={stats.inventory.lowStock}
          icon={AlertTriangle} iconBg="bg-amber-100" iconColor="text-amber-600"
          sub="≤ 5 units" warn={stats.inventory.lowStock > 0}
          href="/admin/inventory?filter=low" />
        <KpiCard label="Out of Stock" value={stats.inventory.outOfStock}
          icon={PackageX} iconBg="bg-red-100" iconColor="text-red-600"
          sub="0 units" warn={stats.inventory.outOfStock > 0}
          href="/admin/inventory?filter=out" />
      </div>

      {/* ── Charts row 1 ── */}
      {analytics && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Revenue</h3>
                  <p className="text-xs text-slate-400">Last 30 days</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                  {ngnFull(stats.revenue.thisMonth)}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={analytics.revenueByDay} margin={{top:4,right:0,bottom:0,left:0}}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={shortDate}
                    tick={{fontSize:10,fill:"#94a3b8"}} interval={6}
                    tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => ngn(v)} tick={{fontSize:10,fill:"#94a3b8"}}
                    tickLine={false} axisLine={false} width={55} />
                  <Tooltip content={<RevTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2}
                    fill="url(#revGrad)" dot={false} activeDot={{r:4,fill:"#3b82f6"}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Order status donut */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Order Status</h3>
                <p className="text-xs text-slate-400">All time</p>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={analytics.byStatus} dataKey="count" nameKey="status"
                    cx="50%" cy="50%" outerRadius={70} innerRadius={44}>
                    {analytics.byStatus.map((e, i) => (
                      <Cell key={i} fill={PIE_COLORS[e.status] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, n: any) => [v, n]}
                    contentStyle={{fontSize:11,borderRadius:12,border:"1px solid #e2e8f0"}}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {analytics.byStatus.slice(0, 4).map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{backgroundColor: PIE_COLORS[s.status] ?? "#94a3b8"}} />
                      <span className="text-xs text-slate-600">{s.status}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts row 2: orders + top products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Daily Orders</h3>
                <p className="text-xs text-slate-400">Last 30 days</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.ordersByDay} margin={{top:4,right:0,bottom:0,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={shortDate}
                    tick={{fontSize:10,fill:"#94a3b8"}} interval={6}
                    tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false}
                    axisLine={false} allowDecimals={false} width={24} />
                  <Tooltip content={<OrdTooltip />} />
                  <Bar dataKey="orders" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top products */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Top Products</h3>
                <p className="text-xs text-slate-400">By revenue (30 days)</p>
              </div>
              {analytics.topProducts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No sales data yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics.topProducts.map((p, i) => {
                    const max = analytics.topProducts[0].revenue;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-slate-700 truncate flex-1 mr-2">{p.name}</p>
                          <p className="text-xs text-slate-500 flex-shrink-0">{p.qty} sold</p>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                            style={{width:`${(p.revenue / max) * 100}%`}} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{ngnFull(p.revenue)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Map row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-900">Order Locations</h3>
                <p className="text-xs text-slate-400">Geographic distribution</p>
              </div>
              <OrderMap data={analytics.byCountry} />
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">By Country</h3>
              </div>
              {analytics.byCountry.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No location data yet</p>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[300px]">
                  {analytics.byCountry.map((c, i) => {
                    const max = analytics.byCountry[0].count;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-medium text-slate-700 truncate flex-1 mr-2">{c.country}</p>
                          <p className="text-xs text-slate-500 flex-shrink-0">{c.count}</p>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full"
                            style={{width:`${(c.count / max)*100}%`}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Recent Orders ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
            <p className="text-xs text-slate-400">Latest activity</p>
          </div>
          <Link href="/admin/orders"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-slate-50">
                {["Order","Customer","Items","Amount","Status","Date"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold
                    text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.recentOrders.map((o: any) => (
                <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-mono font-medium text-slate-700">
                    #{o.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-medium text-slate-800">
                      {o.profile?.fullName ?? "—"}
                    </p>
                    <p className="text-[10px] text-slate-400">{o.address?.city}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{o.items?.length ?? 0}</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">
                    {ngnFull(Number(o.totalAmount))}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px]
                      font-semibold border ${STATUS_COLORS[o.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-50">
          {stats.recentOrders.map((o: any) => (
            <div key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-mono font-bold text-slate-700">
                  #{o.id.slice(-8).toUpperCase()}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px]
                  font-semibold border ${STATUS_COLORS[o.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                  {o.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{o.profile?.fullName ?? "—"}</p>
                  <p className="text-[10px] text-slate-400">{o.address?.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{ngnFull(Number(o.totalAmount))}</p>
                  <p className="text-[10px] text-slate-400">
                    {o.items?.length ?? 0} item{(o.items?.length ?? 0) !== 1 ? "s" : ""} ·{" "}
                    {new Date(o.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {stats.recentOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No orders yet</p>
          </div>
        )}
      </div>

    </div>
  );
}
