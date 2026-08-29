// src/app/admin/inventory/InventoryContent.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search, Boxes, Pencil, Check, X, Loader2, Package,
} from "lucide-react";

type Variant = {
  id: string; colorLabel: string; size: string; sku: string;
  stockQuantity: number; priceOverride: number | null;
};
type Product = {
  id: string; name: string; type: string; gender: string; isPublished: boolean;
  images: { url: string }[];
  variants: Variant[];
  stockSummary: { total: number; outOfStock: number; lowStock: number };
};

const stockBadge = (qty: number) =>
  qty === 0 ? "bg-red-100 text-red-700 border-red-200"
  : qty <= 5 ? "bg-amber-100 text-amber-700 border-amber-200"
  : "bg-emerald-100 text-emerald-700 border-emerald-200";

const FILTERS = [
  { v: "all", l: "All"          },
  { v: "low", l: "Low Stock"    },
  { v: "out", l: "Out of Stock" },
];

export default function InventoryContent() {
  const sp = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState(sp.get("filter") ?? "all");
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [editing,  setEditing]  = useState<{ variantId: string; value: string } | null>(null);
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) p.set("q", search);
    if (filter !== "all") p.set("filter", filter);
    const r = await fetch(`/api/admin/inventory?${p}`);
    const d = await r.json();
    if (d.success) {
      setProducts(d.data.products);
      setTotal(d.data.pagination.total);
      setPages(d.data.pagination.pages);
    }
    setLoading(false);
  }, [page, search, filter]);

  useEffect(() => { load(); }, [load]);

  async function saveStock(variantId: string, value: string) {
    const qty = parseInt(value);
    if (isNaN(qty) || qty < 0) { alert("Enter a valid quantity"); return; }
    setSaving(true);
    const r = await fetch(`/api/admin/inventory/${variantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQuantity: qty, operation: "set" }),
    });
    const d = await r.json();
    if (d.success) {
      setProducts(prev => prev.map(p => ({
        ...p,
        variants: p.variants.map(v =>
          v.id === variantId ? { ...v, stockQuantity: d.data.stockQuantity } : v
        ),
      })));
      setEditing(null);
    } else alert(d.error ?? "Failed");
    setSaving(false);
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <p className="text-sm text-slate-500">{total} products</p>

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Search name, SKU…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-56 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm
              text-slate-800 placeholder:text-slate-400 outline-none
              focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button key={f.v} onClick={() => { setFilter(f.v); setPage(1); }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                filter === f.v
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Product cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-16">
          <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">No products found</p>
          <p className="text-xs text-slate-400 mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

              {/* Product header */}
              <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100">
                {product.images[0] ? (
                  <div className="relative w-10 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                    <Image src={product.images[0].url} alt={product.name} fill
                      className="object-cover object-top" sizes="40px"/>
                  </div>
                ) : (
                  <div className="w-10 h-14 rounded-lg bg-slate-100 flex-shrink-0
                    flex items-center justify-center">
                    <Package className="w-4 h-4 text-slate-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{product.name}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    {product.type} · {product.gender.toLowerCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                  <div className="text-right mr-1">
                    <p className="text-[11.5px] font-semibold text-slate-400 uppercase">Total</p>
                    <p className="text-sm font-bold text-slate-900">{product.stockSummary.total}</p>
                  </div>
                  {product.stockSummary.outOfStock > 0 && (
                    <span className="px-2 py-0.5 text-[11.5px] font-semibold bg-red-100 text-red-700
                      border border-red-200 rounded-full">
                      {product.stockSummary.outOfStock} out
                    </span>
                  )}
                  {product.stockSummary.lowStock > 0 && (
                    <span className="px-2 py-0.5 text-[11.5px] font-semibold bg-amber-100 text-amber-700
                      border border-amber-200 rounded-full">
                      {product.stockSummary.lowStock} low
                    </span>
                  )}
                  {!product.isPublished && (
                    <span className="px-2 py-0.5 text-[11.5px] font-semibold bg-slate-100 text-slate-500
                      border border-slate-200 rounded-full">
                      Draft
                    </span>
                  )}
                </div>
              </div>

              {/* Variants table — desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="bg-slate-50">
                      {["SKU","Colour","Size","Stock","Edit"].map(h => (
                        <th key={h} className="text-left px-5 py-2.5 text-[11.5px] font-semibold
                          text-slate-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {product.variants.map(variant => (
                      <tr key={variant.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-2.5 text-[12.5px] font-mono text-slate-500">{variant.sku}</td>
                        <td className="px-5 py-2.5 text-xs text-slate-700">{variant.colorLabel}</td>
                        <td className="px-5 py-2.5 text-xs font-semibold text-slate-700">{variant.size}</td>
                        <td className="px-5 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11.5px]
                            font-semibold border ${stockBadge(variant.stockQuantity)}`}>
                            {variant.stockQuantity} units
                          </span>
                        </td>
                        <td className="px-5 py-2.5">
                          {editing?.variantId === variant.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number" min={0} value={editing.value} autoFocus
                                onChange={e => setEditing({ variantId: variant.id, value: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === "Enter")  saveStock(variant.id, editing.value);
                                  if (e.key === "Escape") setEditing(null);
                                }}
                                className="w-20 px-2.5 py-1.5 border border-blue-300 rounded-lg text-xs
                                  outline-none focus:ring-2 focus:ring-blue-100"
                              />
                              <button disabled={saving}
                                onClick={() => saveStock(variant.id, editing.value)}
                                className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700
                                  transition-colors disabled:opacity-40">
                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              </button>
                              <button onClick={() => setEditing(null)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400
                                  hover:text-slate-700 hover:border-slate-400 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditing({ variantId: variant.id, value: String(variant.stockQuantity) })}
                              className="inline-flex items-center gap-1 text-[12.5px] font-semibold
                                text-blue-600 hover:text-blue-700 transition-colors">
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Variants — mobile cards */}
              <div className="md:hidden divide-y divide-slate-50">
                {product.variants.map(variant => (
                  <div key={variant.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700">
                          {variant.colorLabel} · {variant.size}
                        </p>
                        <p className="text-[11.5px] font-mono text-slate-400 truncate">{variant.sku}</p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11.5px]
                        font-semibold border flex-shrink-0 ${stockBadge(variant.stockQuantity)}`}>
                        {variant.stockQuantity}
                      </span>
                    </div>
                    <div className="mt-2">
                      {editing?.variantId === variant.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number" min={0} value={editing.value} autoFocus
                            onChange={e => setEditing({ variantId: variant.id, value: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === "Enter")  saveStock(variant.id, editing.value);
                              if (e.key === "Escape") setEditing(null);
                            }}
                            className="w-24 px-2.5 py-1.5 border border-blue-300 rounded-lg text-xs
                              outline-none focus:ring-2 focus:ring-blue-100"
                          />
                          <button disabled={saving}
                            onClick={() => saveStock(variant.id, editing.value)}
                            className="p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-40">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          </button>
                          <button onClick={() => setEditing(null)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditing({ variantId: variant.id, value: String(variant.stockQuantity) })}
                          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-blue-600">
                          <Pencil className="w-3 h-3" /> Edit stock
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg
                hover:bg-slate-50 disabled:opacity-40 transition-colors">
              Previous
            </button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg
                hover:bg-slate-50 disabled:opacity-40 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
