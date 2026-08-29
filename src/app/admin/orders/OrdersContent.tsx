// src/app/admin/orders/OrdersContent.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search, X, ShoppingCart, ArrowRight, Loader2,
  User, MapPin, Package, CreditCard, StickyNote,
} from "lucide-react";

type OrderItem = {
  product: { name: string };
  variant: { colorLabel: string; size: string; sku: string };
  quantity: number; unitPrice: number; total: number;
};
type Order = {
  id: string; status: string; paymentStatus: string;
  paymentProvider: string | null; totalAmount: number;
  currency: string; notes: string | null; createdAt: string;
  profile: { fullName: string | null; email: string; phone: string | null };
  address: {
    fullName: string; phone: string; addressLine1: string;
    addressLine2?: string; city: string; state: string; country: string;
  };
  items: OrderItem[];
};

const STATUSES = ["ALL","PENDING","PAID","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"];
const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-amber-100 text-amber-700 border-amber-200",
  PAID:       "bg-blue-100 text-blue-700 border-blue-200",
  PROCESSING: "bg-violet-100 text-violet-700 border-violet-200",
  SHIPPED:    "bg-indigo-100 text-indigo-700 border-indigo-200",
  DELIVERED:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED:  "bg-red-100 text-red-700 border-red-200",
  REFUNDED:   "bg-slate-100 text-slate-500 border-slate-200",
};
const NEXT: Record<string, string[]> = {
  PENDING:["PAID","CANCELLED"], PAID:["PROCESSING","CANCELLED"],
  PROCESSING:["SHIPPED","CANCELLED"], SHIPPED:["DELIVERED"],
};
const fmt = (n: number, cur = "NGN") =>
  new Intl.NumberFormat("en-NG", { style:"currency", currency:cur, minimumFractionDigits:0 }).format(n);

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px]
      font-semibold border ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

export default function OrdersContent() {
  const sp = useSearchParams();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [sel,     setSel]     = useState<Order | null>(null);
  const [busy,    setBusy]    = useState(false);
  const [search,  setSearch]  = useState(sp.get("q") ?? "");
  const [status,  setStatus]  = useState(sp.get("status") ?? "ALL");
  const [page,    setPage]    = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) p.set("q", search);
    if (status !== "ALL") p.set("status", status);
    const r = await fetch(`/api/admin/orders?${p}`);
    const d = await r.json();
    if (d.success) {
      setOrders(d.data.orders);
      setTotal(d.data.pagination.total);
      setPages(d.data.pagination.pages);
    }
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, newStatus: string) {
    setBusy(true);
    const r = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const d = await r.json();
    if (d.success) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      if (sel?.id === id) setSel(p => p ? { ...p, status: newStatus } : p);
    } else alert(d.error ?? "Update failed");
    setBusy(false);
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">{total} total orders</p>
      </div>

      {/* Search + status filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Search order ID, email, name…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm
              text-slate-800 placeholder:text-slate-400 outline-none
              focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 text-[12.5px] font-semibold rounded-lg border transition-all ${
                status === s
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No orders found</p>
            <p className="text-xs text-slate-400 mt-1">Orders will appear here once customers start buying</p>
          </div>
        ) : (
          <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Order","Customer","Items","Amount","Payment","Status","Date","Action"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11.5px] font-semibold
                      text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <button onClick={() => setSel(order)}
                        className="text-xs font-mono font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                        #{order.id.slice(-8).toUpperCase()}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-medium text-slate-800">{order.profile.fullName ?? "—"}</p>
                      <p className="text-[11.5px] text-slate-400">{order.profile.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{order.items.length}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">
                      {fmt(Number(order.totalAmount), order.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[11.5px] text-slate-500">{order.paymentProvider ?? "—"}</p>
                      <p className={`text-[11.5px] font-semibold ${
                        order.paymentStatus === "SUCCESS" ? "text-emerald-600" : "text-amber-600"
                      }`}>
                        {order.paymentStatus}
                      </p>
                    </td>
                    <td className="px-5 py-3.5"><Badge status={order.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        {(NEXT[order.status] ?? []).map(next => (
                          <button key={next} disabled={busy}
                            onClick={() => updateStatus(order.id, next)}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-[11.5px] font-semibold
                              rounded-lg border transition-all disabled:opacity-40 ${
                              next === "CANCELLED"
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-blue-200 text-blue-600 hover:bg-blue-50"
                            }`}>
                            <ArrowRight className="w-2.5 h-2.5" /> {next}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {orders.map(order => (
              <div key={order.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => setSel(order)}
                    className="text-xs font-mono font-bold text-blue-600">
                    #{order.id.slice(-8).toUpperCase()}
                  </button>
                  <Badge status={order.status} />
                </div>
                <div className="mt-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {order.profile.fullName ?? "—"}
                  </p>
                  <p className="text-[12.5px] text-slate-400">{order.profile.email}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-bold text-slate-900">
                    {fmt(Number(order.totalAmount), order.currency)}
                  </p>
                  <p className="text-[12.5px] text-slate-400">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[11.5px] font-semibold ${
                    order.paymentStatus === "SUCCESS" ? "text-emerald-600" : "text-amber-600"
                  }`}>
                    {order.paymentProvider ?? "—"} · {order.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button onClick={() => setSel(order)}
                    className="px-3 py-1.5 text-[12.5px] font-semibold rounded-lg border
                      border-slate-200 text-slate-600 hover:border-slate-400 transition-all">
                    Details
                  </button>
                  {(NEXT[order.status] ?? []).map(next => (
                    <button key={next} disabled={busy}
                      onClick={() => updateStatus(order.id, next)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-[12.5px] font-semibold
                        rounded-lg border transition-all disabled:opacity-40 ${
                        next === "CANCELLED"
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-blue-200 text-blue-600 hover:bg-blue-50"
                      }`}>
                      <ArrowRight className="w-2.5 h-2.5" /> {next}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          </>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg
                  hover:bg-slate-50 disabled:opacity-40 transition-colors">
                Previous
              </button>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg
                  hover:bg-slate-50 disabled:opacity-40 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Order detail drawer ── */}
      {sel && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setSel(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-white z-50
            overflow-y-auto shadow-2xl">

            {/* Drawer header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4
              flex items-center justify-between z-10">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Order #{sel.id.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(sel.createdAt).toLocaleString("en-GB")}
                </p>
              </div>
              <button onClick={() => setSel(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* Status + transitions */}
              <div>
                <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Status
                </p>
                <Badge status={sel.status} />
                {(NEXT[sel.status] ?? []).length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {(NEXT[sel.status] ?? []).map(next => (
                      <button key={next} disabled={busy}
                        onClick={() => updateStatus(sel.id, next)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold
                          rounded-xl transition-all disabled:opacity-40 ${
                          next === "CANCELLED"
                            ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/25"
                        }`}>
                        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                        Mark as {next}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer */}
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider">Customer</p>
                </div>
                <p className="text-sm font-semibold text-slate-800">{sel.profile.fullName ?? "—"}</p>
                <p className="text-xs text-slate-500">{sel.profile.email}</p>
                {sel.profile.phone && <p className="text-xs text-slate-500">{sel.profile.phone}</p>}
              </div>

              {/* Address */}
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider">Delivery Address</p>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {sel.address.fullName}<br/>
                  {sel.address.addressLine1}<br/>
                  {sel.address.addressLine2 && <>{sel.address.addressLine2}<br/></>}
                  {sel.address.city}, {sel.address.state}<br/>
                  {sel.address.country}
                </p>
                <p className="text-xs text-slate-500 mt-1.5">{sel.address.phone}</p>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider">
                    Items ({sel.items.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {sel.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start rounded-xl border
                      border-slate-100 p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.product.name}</p>
                        <p className="text-[11.5px] text-slate-400 mt-0.5">
                          {item.variant.colorLabel} · {item.variant.size} · {item.variant.sku}
                        </p>
                        <p className="text-[11.5px] text-slate-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 flex-shrink-0">
                        {fmt(Number(item.total), sel.currency)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 px-3">
                  <p className="text-xs font-semibold text-slate-500">Total</p>
                  <p className="text-base font-bold text-slate-900">
                    {fmt(Number(sel.totalAmount), sel.currency)}
                  </p>
                </div>
              </div>

              {/* Payment */}
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider">Payment</p>
                </div>
                <p className="text-xs text-slate-700">
                  Provider: <span className="font-semibold">{sel.paymentProvider ?? "—"}</span>
                </p>
                <p className="text-xs text-slate-700">
                  Status:{" "}
                  <span className={`font-semibold ${
                    sel.paymentStatus === "SUCCESS" ? "text-emerald-600" : "text-amber-600"
                  }`}>
                    {sel.paymentStatus}
                  </span>
                </p>
              </div>

              {/* Notes */}
              {sel.notes && (
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-[11.5px] font-semibold text-amber-600 uppercase tracking-wider">Notes</p>
                  </div>
                  <p className="text-xs text-amber-800">{sel.notes}</p>
                </div>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}
