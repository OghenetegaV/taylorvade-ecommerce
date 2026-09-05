// src/app/admin/products/page.tsx
"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff,
  Package, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";

type Product = {
  id: string; name: string; slug: string; type: string;
  basePrice: number; genders: string[]; isNew: boolean;
  isPublished: boolean; isFeatured: boolean; createdAt: string;
  categories: { name: string }[];
  images: { url: string }[];
  variants: { id: string; stockQuantity: number; colorLabel: string; size: string }[];
  _count: { variants: number; orderItems: number };
};

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-semibold ${
      published
        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
        : "bg-slate-100 text-slate-500 border border-slate-200"
    }`}>
      {published
        ? <><CheckCircle2 className="w-2.5 h-2.5" />Live</>
        : <><XCircle className="w-2.5 h-2.5" />Draft</>}
    </span>
  );
}

function ProductsContent() {
  const sp = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState(sp.get("q") ?? "");
  const [page,     setPage]     = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togging,  setTogging]  = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) p.set("q", search);
    const r = await fetch(`/api/admin/products?${p}`);
    const d = await r.json();
    if (d.success) {
      setProducts(d.data.products);
      setTotal(d.data.pagination.total);
      setPages(d.data.pagination.pages);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?\nIf this product has orders, it will be unpublished instead.`)) return;
    setDeleting(id);
    const r = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (d.success) {
      if (d.action === "unpublished") {
        alert("Product has existing orders — unpublished instead of deleted.");
        setProducts(prev => prev.map(p => p.id === id ? { ...p, isPublished: false } : p));
      } else {
        setProducts(prev => prev.filter(p => p.id !== id));
        setTotal(t => t - 1);
      }
    } else alert(d.error ?? "Failed");
    setDeleting(null);
  }

  async function togglePublish(id: string, current: boolean) {
    setTogging(id);
    const r = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    const d = await r.json();
    if (d.success) setProducts(prev => prev.map(p => p.id === id ? { ...p, isPublished: !current } : p));
    setTogging(null);
  }

  const totalStock = (variants: Product["variants"]) =>
    variants.reduce((s, v) => s + v.stockQuantity, 0);

  const stockColor = (qty: number) =>
    qty === 0 ? "text-red-600" : qty <= 5 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-slate-500">{total} total products</p>
        </div>
        <Link href="/admin/products/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
            text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-500/25">
          <Plus className="w-3.5 h-3.5" />
          Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text" placeholder="Search products by name, type, slug…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full md:w-80 pl-10 pr-4 py-2.5 bg-white border border-slate-200
            rounded-xl text-sm text-slate-800 placeholder:text-slate-400
            outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No products found</p>
            <p className="text-xs text-slate-400 mt-1">Add your first product to get started</p>
            <Link href="/admin/products/new"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white text-xs
                font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Product
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Product","Category","Price","Stock","Status","Orders","Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11.5px] font-semibold
                        text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
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
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate max-w-[160px]">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-400">{product.type}</p>
                            {product.isNew && (
                              <span className="text-[10.5px] bg-violet-100 text-violet-700 font-semibold
                                px-1.5 py-0.5 rounded-full">
                                New In
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {product.categories.map(c => c.name).join(", ") || "—"}
                        <p className="text-[11.5px] text-slate-400 capitalize">{product.genders.join(" / ").toLowerCase()}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">
                        ₦{Number(product.basePrice).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className={`text-xs font-semibold ${stockColor(totalStock(product.variants))}`}>
                          {totalStock(product.variants)} units
                        </p>
                        <p className="text-[11.5px] text-slate-400">{product._count.variants} variants</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge published={product.isPublished} />
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                        {product._count.orderItems}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Edit */}
                          <Link href={`/admin/products/${product.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600
                              hover:bg-blue-50 transition-all" title="Edit product">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          {/* Toggle publish */}
                          <button
                            disabled={togging === product.id}
                            onClick={() => togglePublish(product.id, product.isPublished)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600
                              hover:bg-emerald-50 transition-all"
                            title={product.isPublished ? "Unpublish" : "Publish"}>
                            {product.isPublished
                              ? <EyeOff className="w-3.5 h-3.5" />
                              : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          {/* View on store */}
                          <Link href={`/products/${product.slug}`} target="_blank"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700
                              hover:bg-slate-100 transition-all" title="View on store">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {/* Delete */}
                          <button
                            disabled={deleting === product.id}
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600
                              hover:bg-red-50 transition-all" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {products.map(product => (
                <div key={product.id} className="p-4 flex items-start gap-3">
                  {product.images[0] ? (
                    <div className="relative w-14 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
                      <Image src={product.images[0].url} alt={product.name} fill
                        className="object-cover object-top" sizes="56px"/>
                    </div>
                  ) : (
                    <div className="w-14 h-20 rounded-xl bg-slate-100 flex-shrink-0
                      flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                      <StatusBadge published={product.isPublished} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{product.type}</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">₦{Number(product.basePrice).toLocaleString()}</p>
                    <p className={`text-xs font-medium mt-0.5 ${stockColor(totalStock(product.variants))}`}>
                      {totalStock(product.variants)} units · {product._count.orderItems} orders
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Link href={`/admin/products/${product.id}/edit`}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600
                          hover:text-blue-700 transition-colors">
                        <Pencil className="w-3 h-3" /> Edit
                      </Link>
                      <button onClick={() => togglePublish(product.id, product.isPublished)}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
                        {product.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button disabled={deleting === product.id}
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
                        Delete
                      </button>
                    </div>
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
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
