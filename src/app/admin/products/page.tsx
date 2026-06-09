// src/app/admin/products/page.tsx
"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

type Product = {
  id: string; name: string; slug: string; type: string;
  basePrice: number; gender: string; isNew: boolean;
  isPublished: boolean; isFeatured: boolean; createdAt: string;
  category: { name: string } | null;
  images: { url: string }[];
  variants: { id: string; stockQuantity: number; colorLabel: string; size: string }[];
  _count: { variants: number; orderItems: number };
};

function ProductsContent() {
  const sp = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState(sp.get("q") ?? "");
  const [page,     setPage]     = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

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
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    const r = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (d.success) {
      if (d.action === "unpublished") {
        alert("This product has existing orders. It has been unpublished instead of deleted.");
        setProducts(prev => prev.map(p => p.id === id ? { ...p, isPublished: false } : p));
      } else {
        setProducts(prev => prev.filter(p => p.id !== id));
        setTotal(t => t - 1);
      }
    } else {
      alert(d.error ?? "Failed to delete");
    }
    setDeleting(null);
  }

  async function togglePublish(id: string, current: boolean) {
    const r = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    const d = await r.json();
    if (d.success) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isPublished: !current } : p));
    }
  }

  const totalStock = (variants: Product["variants"]) =>
    variants.reduce((s, v) => s + v.stockQuantity, 0);

  return (
    <div className="p-4 md:p-8 font-serif">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] md:text-[22px] text-[#1a1008] tracking-wide">Products</h1>
          <p className="text-[11px] text-[#8a7a6a] mt-0.5">{total} total</p>
        </div>
        <Link href="/admin/products/new"
          className="bg-[#1a1008] text-white text-[10.5px] tracking-[0.15em] uppercase
            px-5 py-2.5 hover:bg-[#3a2e22] transition-colors">
          + Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text" placeholder="Search by name, type, slug…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border border-[#e8e2db] bg-white px-4 py-2 text-[11.5px]
            outline-none focus:border-[#1a1008] w-full md:w-72 font-serif"
        />
      </div>

      {/* Products list */}
      {loading ? (
        <div className="py-16 text-center text-[11px] tracking-widest text-[#8a7a6a]">Loading…</div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-[#e8e2db] rounded-lg p-16 text-center">
          <p className="text-[12px] text-[#8a7a6a] mb-4">No products yet.</p>
          <Link href="/admin/products/new"
            className="inline-block border border-[#1a1008] px-6 py-2.5 text-[10.5px]
              tracking-[0.15em] uppercase text-[#1a1008] hover:bg-[#1a1008] hover:text-white transition-colors">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-[#e8e2db] rounded-lg overflow-hidden">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-[#faf9f7] border-b border-[#e8e2db]">
                  {["Product","Category","Price","Stock","Status","Orders","Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] tracking-[0.15em] text-[#8a7a6a] uppercase font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-[#f0eeeb] hover:bg-[#faf9f7]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <div className="relative w-10 h-14 flex-shrink-0 overflow-hidden bg-[#f0eeeb]">
                            <Image src={product.images[0].url} alt={product.name} fill
                              className="object-cover object-top" sizes="40px"/>
                          </div>
                        ) : (
                          <div className="w-10 h-14 bg-[#f0eeeb] flex-shrink-0 flex items-center justify-center">
                            <span className="text-[#c8c0b8] text-[18px]">◻</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[#1a1008] truncate max-w-[160px]">{product.name}</p>
                          <p className="text-[10px] text-[#8a7a6a]">{product.type}</p>
                          {product.isNew && (
                            <span className="text-[9px] tracking-wide bg-[#1a1008] text-white px-1.5 py-0.5 rounded-full">
                              New In
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#8a7a6a]">{product.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#1a1008]">
                      ₦{Number(product.basePrice).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] ${
                        totalStock(product.variants) === 0  ? "text-red-600" :
                        totalStock(product.variants) <= 5   ? "text-amber-600" :
                        "text-green-600"
                      }`}>
                        {totalStock(product.variants)} units
                      </span>
                      <p className="text-[10px] text-[#8a7a6a]">{product._count.variants} variants</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublish(product.id, product.isPublished)}
                        className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors cursor-pointer ${
                          product.isPublished
                            ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        {product.isPublished ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[#8a7a6a]">{product._count.orderItems}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/products/${product.slug}`} target="_blank"
                          className="text-[10.5px] text-[#8a7a6a] hover:text-[#1a1008] underline underline-offset-2">
                          View
                        </Link>
                        <button
                          disabled={deleting === product.id}
                          onClick={() => handleDelete(product.id, product.name)}
                          className="text-[10.5px] text-red-500 hover:text-red-700 underline underline-offset-2 disabled:opacity-40">
                          {deleting === product.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.map(product => (
              <div key={product.id} className="bg-white border border-[#e8e2db] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {product.images[0] ? (
                    <div className="relative w-14 h-20 flex-shrink-0 overflow-hidden bg-[#f0eeeb]">
                      <Image src={product.images[0].url} alt={product.name} fill
                        className="object-cover object-top" sizes="56px"/>
                    </div>
                  ) : (
                    <div className="w-14 h-20 bg-[#f0eeeb] flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] text-[#1a1008]">{product.name}</p>
                      <button
                        onClick={() => togglePublish(product.id, product.isPublished)}
                        className={`px-2 py-0.5 rounded-full text-[10px] flex-shrink-0 ${
                          product.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.isPublished ? "Live" : "Draft"}
                      </button>
                    </div>
                    <p className="text-[10.5px] text-[#8a7a6a]">{product.type}</p>
                    <p className="text-[11px] text-[#1a1008] mt-1">
                      ₦{Number(product.basePrice).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[10px] text-[#8a7a6a]">{totalStock(product.variants)} units</p>
                      <p className="text-[10px] text-[#8a7a6a]">{product._count.orderItems} orders</p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Link href={`/products/${product.slug}`} target="_blank"
                        className="text-[10.5px] text-[#8a7a6a] underline underline-offset-2">View</Link>
                      <button disabled={deleting === product.id}
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-[10.5px] text-red-500 underline underline-offset-2 disabled:opacity-40">
                        {deleting === product.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-[11px] tracking-widest text-[#8a7a6a] font-serif">Loading…</div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
