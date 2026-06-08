// src/app/admin/orders/OrdersContent.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

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
  PENDING:"bg-amber-100 text-amber-800", PAID:"bg-blue-100 text-blue-800",
  PROCESSING:"bg-purple-100 text-purple-800", SHIPPED:"bg-indigo-100 text-indigo-800",
  DELIVERED:"bg-green-100 text-green-800", CANCELLED:"bg-red-100 text-red-800",
  REFUNDED:"bg-gray-100 text-gray-600",
};
const NEXT: Record<string, string[]> = {
  PENDING:["PAID","CANCELLED"], PAID:["PROCESSING","CANCELLED"],
  PROCESSING:["SHIPPED","CANCELLED"], SHIPPED:["DELIVERED"],
};
const fmt = (n: number, cur = "NGN") =>
  new Intl.NumberFormat("en-NG", { style:"currency", currency:cur, minimumFractionDigits:0 }).format(n);

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
    } else {
      alert(d.error ?? "Update failed");
    }
    setBusy(false);
  }

  return (
    <div className="p-8 font-serif">
      <div className="mb-6">
        <h1 className="text-[22px] text-[#1a1008] tracking-wide">Orders</h1>
        <p className="text-[11px] text-[#8a7a6a] mt-0.5">{total} total</p>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input
          type="text" placeholder="Search by order ID, email, name…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border border-[#e8e2db] bg-white px-4 py-2 text-[11.5px]
            outline-none focus:border-[#1a1008] w-64 font-serif"
        />
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 text-[10px] tracking-[0.1em] border font-serif transition-colors ${
                status === s
                  ? "border-[#1a1008] bg-[#1a1008] text-white"
                  : "border-[#e8e2db] bg-white text-[#5a4a3a] hover:border-[#1a1008]"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#e8e2db] overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-[11px] tracking-widest text-[#8a7a6a]">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-[11px] tracking-widest text-[#8a7a6a]">No orders found</div>
        ) : (
          <table className="w-full text-[11.5px] min-w-[900px]">
            <thead>
              <tr className="bg-[#faf9f7] border-b border-[#e8e2db]">
                {["Order","Customer","Items","Amount","Payment","Status","Date","Action"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] tracking-[0.15em] text-[#8a7a6a] uppercase font-normal whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-[#f0eeeb] hover:bg-[#faf9f7]">
                  <td className="px-4 py-3">
                    <button onClick={() => setSel(order)}
                      className="font-mono text-[#1a1008] hover:underline">
                      #{order.id.slice(-8).toUpperCase()}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[#1a1008]">{order.profile.fullName ?? "—"}</div>
                    <div className="text-[10px] text-[#8a7a6a]">{order.profile.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[#8a7a6a]">{order.items.length}</td>
                  <td className="px-4 py-3 text-[#1a1008] font-medium">
                    {fmt(Number(order.totalAmount), order.currency)}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-[#8a7a6a]">
                    {order.paymentProvider ?? "—"}<br/>
                    <span className={order.paymentStatus === "SUCCESS" ? "text-green-600" : "text-amber-600"}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS_COLORS[order.status] ?? ""}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8a7a6a] whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3">
                    {(NEXT[order.status] ?? []).map(next => (
                      <button key={next} disabled={busy}
                        onClick={() => updateStatus(order.id, next)}
                        className="block mb-1 px-2 py-0.5 text-[9.5px] border border-[#c8c0b8]
                          hover:border-[#1a1008] hover:bg-[#1a1008] hover:text-white
                          transition-colors disabled:opacity-40">
                        → {next}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[11px] text-[#8a7a6a]">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button disabled={page<=1} onClick={() => setPage(p=>p-1)}
              className="px-3 py-1.5 border border-[#e8e2db] text-[11px] disabled:opacity-30 hover:border-[#1a1008]">
              Previous
            </button>
            <button disabled={page>=pages} onClick={() => setPage(p=>p+1)}
              className="px-3 py-1.5 border border-[#e8e2db] text-[11px] disabled:opacity-30 hover:border-[#1a1008]">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Order detail drawer */}
      {sel && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSel(null)} />
          <div className="fixed right-0 top-0 h-full w-[460px] bg-white z-50 overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-[#e8e2db] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[13px] tracking-[0.1em] text-[#1a1008]">
                  Order #{sel.id.slice(-8).toUpperCase()}
                </p>
                <p className="text-[10px] text-[#8a7a6a] mt-0.5">
                  {new Date(sel.createdAt).toLocaleString("en-GB")}
                </p>
              </div>
              <button onClick={() => setSel(null)} className="text-[#8a7a6a] hover:text-[#1a1008] text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-5 text-[11.5px]">
              <div>
                <p className="text-[10px] tracking-[0.15em] text-[#8a7a6a] uppercase mb-2">Status</p>
                <span className={`px-3 py-1 rounded-full text-[10.5px] ${STATUS_COLORS[sel.status]}`}>
                  {sel.status}
                </span>
                {(NEXT[sel.status] ?? []).length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {(NEXT[sel.status] ?? []).map(next => (
                      <button key={next} disabled={busy}
                        onClick={() => updateStatus(sel.id, next)}
                        className="px-4 py-2 bg-[#1a1008] text-white text-[10.5px] tracking-[0.1em]
                          hover:bg-[#3a2e22] transition-colors disabled:opacity-40">
                        Mark as {next}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] tracking-[0.15em] text-[#8a7a6a] uppercase mb-2">Customer</p>
                <p className="text-[#1a1008]">{sel.profile.fullName ?? "—"}</p>
                <p className="text-[#8a7a6a]">{sel.profile.email}</p>
                {sel.profile.phone && <p className="text-[#8a7a6a]">{sel.profile.phone}</p>}
              </div>

              <div>
                <p className="text-[10px] tracking-[0.15em] text-[#8a7a6a] uppercase mb-2">Delivery Address</p>
                <p className="text-[#1a1008] leading-relaxed">
                  {sel.address.fullName}<br/>
                  {sel.address.addressLine1}<br/>
                  {sel.address.addressLine2 && <>{sel.address.addressLine2}<br/></>}
                  {sel.address.city}, {sel.address.state}<br/>
                  {sel.address.country}
                </p>
                <p className="text-[#8a7a6a] mt-1">{sel.address.phone}</p>
              </div>

              <div>
                <p className="text-[10px] tracking-[0.15em] text-[#8a7a6a] uppercase mb-3">Items</p>
                {sel.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start border-b border-[#f0eeeb] pb-3 mb-3">
                    <div>
                      <p className="text-[#1a1008]">{item.product.name}</p>
                      <p className="text-[10px] text-[#8a7a6a]">
                        {item.variant.colorLabel} · {item.variant.size} · {item.variant.sku}
                      </p>
                      <p className="text-[10px] text-[#8a7a6a]">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-[#1a1008] font-medium">{fmt(Number(item.total), sel.currency)}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-[#e8e2db] pt-3">
                <p className="text-[12px] tracking-[0.08em] text-[#1a1008]">Total</p>
                <p className="text-[14px] font-medium text-[#1a1008]">
                  {fmt(Number(sel.totalAmount), sel.currency)}
                </p>
              </div>

              {sel.notes && (
                <div>
                  <p className="text-[10px] tracking-[0.15em] text-[#8a7a6a] uppercase mb-2">Notes</p>
                  <p className="text-[#3a2e22]">{sel.notes}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
