// src/app/admin/subscribers/page.tsx
// Email list — launch waitlist (/launch page) and newsletter signups,
// with search, filter tabs and CSV export.

"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search, Sparkles, Mail, Users } from "lucide-react";

type Subscriber = {
  id: string;
  email: string;
  categories: string[];
  smsOptIn: boolean;
  earlyAccess: boolean;
  source: string;
  couponCode: string | null;
  couponUsed: boolean;
  createdAt: string;
};

type Tab = "all" | "early" | "newsletter";

const SOURCE_LABEL: Record<string, string> = {
  "launch-popup": "Launch page",
  checkout:       "Checkout",
  website:        "Newsletter form",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function toCsv(rows: Subscriber[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const head = ["Email", "Early access", "Source", "Coupon code", "Coupon used", "Categories", "SMS opt-in", "Signed up"];
  const body = rows.map(s => [
    esc(s.email),
    s.earlyAccess ? "Yes" : "No",
    esc(SOURCE_LABEL[s.source] ?? s.source),
    esc(s.couponCode ?? ""),
    s.couponUsed ? "Yes" : "No",
    esc(s.categories.join("; ")),
    s.smsOptIn ? "Yes" : "No",
    new Date(s.createdAt).toISOString(),
  ].join(","));
  return [head.join(","), ...body].join("\n");
}

export default function SubscribersPage() {
  const [subs,    setSubs]    = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState<Tab>("all");
  const [query,   setQuery]   = useState("");
  const [week,    setWeek]    = useState(0);

  useEffect(() => {
    fetch("/api/admin/subscribers")
      .then(r => r.json())
      .then(d => {
        if (!d.success) return setError(d.error ?? "Couldn't load subscribers");
        const weekAgo = Date.now() - 7 * 86_400_000;
        setSubs(d.data);
        setWeek(d.data.filter((s: Subscriber) => new Date(s.createdAt).getTime() >= weekAgo).length);
      })
      .catch(() => setError("Couldn't load subscribers"))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    all:        subs.length,
    early:      subs.filter(s => s.earlyAccess).length,
    newsletter: subs.filter(s => !s.earlyAccess).length,
    week,
  }), [subs, week]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subs.filter(s =>
      (tab === "all" || (tab === "early" ? s.earlyAccess : !s.earlyAccess)) &&
      (!q || s.email.includes(q))
    );
  }, [subs, tab, query]);

  function exportCsv() {
    const blob = new Blob([toCsv(visible)], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `taylorvade-${tab === "early" ? "early-access" : tab === "newsletter" ? "newsletter" : "subscribers"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "all",        label: "All",                    count: counts.all },
    { id: "early",      label: "Launch waitlist",         count: counts.early },
    { id: "newsletter", label: "Newsletter only",        count: counts.newsletter },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Subscribers</h1>
        <button
          onClick={exportCsv}
          disabled={visible.length === 0}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs
            font-semibold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Launch waitlist signups", value: counts.early, icon: Sparkles, bg: "bg-amber-100", fg: "text-amber-700" },
          { label: "Total subscribers",           value: counts.all,   icon: Users,    bg: "bg-blue-100",  fg: "text-blue-600" },
          { label: "Joined in the last 7 days",   value: counts.week,  icon: Mail,     bg: "bg-emerald-100", fg: "text-emerald-600" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
              <c.icon className={`w-5 h-5 ${c.fg}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{loading ? "–" : c.value}</p>
              <p className="text-sm text-slate-500 mt-1">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}>
                {t.label} <span className="text-slate-400 font-medium">{t.count}</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search email"
              className="w-full sm:w-60 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm
                outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : visible.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            {subs.length === 0 ? "No signups yet." : "No subscribers match."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">List</th>
                  <th className="px-5 py-3">Signed up via</th>
                  <th className="px-5 py-3">30% code</th>
                  <th className="px-5 py-3">SMS</th>
                  <th className="px-5 py-3 whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      <a href={`mailto:${s.email}`} className="hover:text-blue-600">{s.email}</a>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {s.earlyAccess && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                            Launch waitlist
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 whitespace-nowrap">
                          Newsletter
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{SOURCE_LABEL[s.source] ?? s.source}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {s.couponCode ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-700">{s.couponCode}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            s.couponUsed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            {s.couponUsed ? "Used" : "Unused"}
                          </span>
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{s.smsOptIn ? "Yes" : "—"}</td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{fmtDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
