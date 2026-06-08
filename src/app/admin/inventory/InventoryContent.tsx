// src/app/admin/inventory/InventoryContent.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

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

const badge = (qty: number) =>
  qty === 0 ? "bg-red-100 text-red-700"
  : qty <= 5 ? "bg-amber-100 text-amber-700"
  : "bg-green-100 text-green-700";

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
    } else {
      alert(d.error ?? "Failed");
    }
    setSaving(false);
  }

  return (
    <div className="p-8 font-serif">
      <div className="mb-6">
        <h1 className="text-[22px] text-[#1a1008] tracking-wide">Inventory</h1>
        <p className="text-[11px] text-[#8a7a6a] mt-0.5">{total} products</p>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input
          type="text" placeholder="Search name, SKU…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border border-[#e8e2db] bg-white px-4 py-2 text-[11.5px]
            outline-none focus:border-[#1a1008] w-52 font-serif"
        />
        {[{v:"all",l:"All"},{v:"low",l:"Low Stock"},{v:"out",l:"Out of Stock"}].map(f => (
          <button key={f.v} onClick={() => { setFilter(f.v); setPage(1); }}
            className={`px-4 py-2 text-[10.5px] tracking-[0.1em] border font-serif transition-colors ${
              filter === f.v
                ? "border-[#1a1008] bg-[#1a1008] text-white"
                : "border-[#e8e2db] bg-white text-[#5a4a3a] hover:border-[#1a1008]"
            }`}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-[11px] tracking-widest text-[#8a7a6a]">Loading…</div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-[11px] tracking-widest text-[#8a7a6a]">
          No products found. Add products via Supabase to see them here.
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <div key={product.id} className="bg-white border border-[#e8e2db]">
              <div className="flex items-center gap-4 px-5 py-4 border-b border-[#f0eeeb]">
                {product.images[0] && (
                  <div className="relative w-10 h-14 flex-shrink-0 overflow-hidden bg-[#f0eeeb]">
                    <Image src={product.images[0].url} alt={product.name} fill
                      className="object-cover object-top" sizes="40px"/>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#1a1008] tracking-wide truncate">{product.name}</p>
                  <p className="text-[10.5px] text-[#8a7a6a]">{product.type} · {product.gender}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] tracking-[0.1em] text-[#8a7a6a] uppercase">Total</p>
                    <p className="text-[14px] text-[#1a1008]">{product.stockSummary.total}</p>
                  </div>
                  {product.stockSummary.outOfStock > 0 && (
                    <span className="px-2 py-0.5 text-[9.5px] bg-red-100 text-red-700 rounded-full">
                      {product.stockSummary.outOfStock} out
                    </span>
                  )}
                  {product.stockSummary.lowStock > 0 && (
                    <span className="px-2 py-0.5 text-[9.5px] bg-amber-100 text-amber-700 rounded-full">
                      {product.stockSummary.lowStock} low
                    </span>
                  )}
                  {!product.isPublished && (
                    <span className="px-2 py-0.5 text-[9.5px] bg-gray-100 text-gray-600 rounded-full">
                      draft
                    </span>
                  )}
                </div>
              </div>

              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-[#faf9f7]">
                    {["SKU","Colour","Size","Stock","Edit"].map(h => (
                      <th key={h} className="text-left px-5 py-2 text-[9.5px] tracking-[0.15em] text-[#8a7a6a] uppercase font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map(variant => (
                    <tr key={variant.id} className="border-t border-[#f5f3f0]">
                      <td className="px-5 py-2.5 font-mono text-[#8a7a6a] text-[10px]">{variant.sku}</td>
                      <td className="px-5 py-2.5 text-[#3a2e22]">{variant.colorLabel}</td>
                      <td className="px-5 py-2.5 text-[#3a2e22]">{variant.size}</td>
                      <td className="px-5 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${badge(variant.stockQuantity)}`}>
                          {variant.stockQuantity} units
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        {editing?.variantId === variant.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min={0} value={editing.value} autoFocus
                              onChange={e => setEditing({ variantId: variant.id, value: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === "Enter")  saveStock(variant.id, editing.value);
                                if (e.key === "Escape") setEditing(null);
                              }}
                              className="w-20 border border-[#1a1008] px-2 py-1 text-[11px] outline-none font-serif"
                            />
                            <button disabled={saving}
                              onClick={() => saveStock(variant.id, editing.value)}
                              className="px-3 py-1 bg-[#1a1008] text-white text-[10px] disabled:opacity-40">
                              Save
                            </button>
                            <button onClick={() => setEditing(null)}
                              className="px-2 py-1 border border-[#e8e2db] text-[10px] text-[#8a7a6a] hover:border-[#1a1008]">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditing({ variantId: variant.id, value: String(variant.stockQuantity) })}
                            className="text-[10.5px] text-[#8a7a6a] hover:text-[#1a1008] underline underline-offset-2">
                            Edit stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between mt-5">
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
    </div>
  );
}
