// src/app/admin/discounts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

type Discount = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
};

const inputClass = `w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm
  text-slate-800 placeholder:text-slate-400 outline-none
  focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all`;
const labelClass = "block text-xs font-semibold text-slate-600 mb-1.5";

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/discounts").then(r => r.json()).then(d => {
      if (d.success) setDiscounts(d.data);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !value) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, type, value: parseFloat(value), expiresAt: expiresAt || null }),
    });
    const d = await res.json();
    if (d.success) {
      setDiscounts(prev => [d.data, ...prev]);
      setCode(""); setValue(""); setExpiresAt("");
    } else {
      setError(d.error ?? "Failed to create discount");
    }
    setCreating(false);
  }

  async function toggleActive(discount: Discount) {
    setBusyId(discount.id);
    const res = await fetch(`/api/admin/discounts/${discount.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !discount.isActive }),
    });
    const d = await res.json();
    if (d.success) {
      setDiscounts(prev => prev.map(x => x.id === discount.id ? d.data : x));
    }
    setBusyId(null);
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Delete code "${code}"?`)) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) setDiscounts(prev => prev.filter(x => x.id !== id));
    setBusyId(null);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Discount Codes</h1>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">New Code</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Code</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select value={type} onChange={e => setType(e.target.value as "PERCENTAGE" | "FIXED")} className={inputClass}>
              <option value="PERCENTAGE">Percentage off</option>
              <option value="FIXED">Fixed amount off (₦)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{type === "PERCENTAGE" ? "Percent (0–100)" : "Amount (₦)"}</label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)}
              min="0" max={type === "PERCENTAGE" ? 100 : undefined} step="0.01"
              placeholder={type === "PERCENTAGE" ? "10" : "5000"} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Expires (optional)</label>
            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className={inputClass} />
          </div>
          {error && <p className="sm:col-span-2 text-xs text-red-600">{error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={creating || !code.trim() || !value}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Code
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : discounts.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No discount codes yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Expires</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {discounts.map(d => (
                <tr key={d.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-mono font-semibold text-slate-800">{d.code}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {d.type === "PERCENTAGE" ? `${Number(d.value)}%` : `₦${Number(d.value).toLocaleString()}`}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleActive(d)} disabled={busyId === d.id}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                        d.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                      {d.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDelete(d.id, d.code)} disabled={busyId === d.id}
                      className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
