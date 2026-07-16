// src/app/admin/products/[id]/edit/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Props { params: Promise<{ id: string }> }

const inputClass = `w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm
  text-slate-800 placeholder:text-slate-400 outline-none
  focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all`;
const textareaClass = `${inputClass} resize-none`;
const labelClass = "block text-xs font-semibold text-slate-600 mb-1.5";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
      <h3 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function EditProductPage({ params }: Props) {
  const { id } = use(params);
  const router  = useRouter();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [status,   setStatus]   = useState<"idle"|"success"|"error">("idle");
  const [errMsg,   setErrMsg]   = useState("");

  // Form fields
  const [name,            setName]            = useState("");
  const [type,            setType]            = useState("");
  const [description,     setDescription]     = useState("");
  const [editorNotes,     setEditorNotes]     = useState("");
  const [sizeFit,         setSizeFit]         = useState("");
  const [deliveryReturns, setDeliveryReturns] = useState("");
  const [basePrice,       setBasePrice]       = useState("");
  const [gender,          setGender]          = useState("UNISEX");
  const [isNew,           setIsNew]           = useState(false);
  const [isFeatured,      setIsFeatured]      = useState(false);
  const [isPublished,     setIsPublished]     = useState(false);

  // Load product
  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) { setErrMsg("Product not found"); return; }
        const p = d.data;
        setName(p.name ?? "");
        setType(p.type ?? "");
        setDescription(p.description ?? "");
        setEditorNotes(p.editorNotes ?? "");
        setSizeFit(p.sizeFit ?? "");
        setDeliveryReturns(p.deliveryReturns ?? "");
        setBasePrice(String(p.basePrice ?? ""));
        setGender(p.gender ?? "UNISEX");
        setIsNew(p.isNew ?? false);
        setIsFeatured(p.isFeatured ?? false);
        setIsPublished(p.isPublished ?? false);
      })
      .catch(() => setErrMsg("Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !type.trim() || !basePrice) {
      setErrMsg("Name, type and price are required."); return;
    }
    setSaving(true);
    setErrMsg("");
    setStatus("idle");

    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, type, description, editorNotes, sizeFit, deliveryReturns,
        basePrice: parseFloat(basePrice),
        gender, isNew, isFeatured, isPublished,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (data.success) {
      setStatus("success");
      setTimeout(() => router.push("/admin/products"), 1200);
    } else {
      setStatus("error");
      setErrMsg(data.error ?? "Failed to update product.");
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading product…</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Back link */}
      <Link href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500
          hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      {/* Status banners */}
      {status === "success" && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200
          rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Product updated — redirecting…
        </div>
      )}
      {(status === "error" || errMsg) && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200
          rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">

        {/* Basic info */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Product Name <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                required placeholder="e.g. Salim" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Product Type <span className="text-red-500">*</span></label>
              <input type="text" value={type} onChange={e => setType(e.target.value)}
                required placeholder="e.g. Contrast Raglan Shirt" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Base Price (₦) <span className="text-red-500">*</span></label>
              <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)}
                required min="0" step="0.01" placeholder="e.g. 45000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className={inputClass}>
                <option value="MEN">Men</option>
                <option value="WOMEN">Women</option>
                <option value="UNISEX">Unisex</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Short Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} placeholder="Brief product description…" className={textareaClass} />
          </div>
        </Section>

        {/* Status */}
        <Section title="Status & Labels">
          <div className="flex flex-wrap gap-5">
            {[
              { label: "Published (visible on store)", val: isPublished, set: setIsPublished },
              { label: "New In badge",                 val: isNew,       set: setIsNew       },
              { label: "Featured",                     val: isFeatured,  set: setIsFeatured  },
            ].map(({ label, val, set }) => (
              <label key={label} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                  val ? "bg-blue-600 border-blue-600" : "border-slate-300 group-hover:border-blue-400"
                }`}>
                  {val && <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>}
                </div>
                <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="sr-only" />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Product page content */}
        <Section title="Product Page Content">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Editor&apos;s Notes</label>
              <textarea value={editorNotes} onChange={e => setEditorNotes(e.target.value)} rows={4}
                placeholder="Detailed product description for the product page accordion…"
                className={textareaClass} />
            </div>
            <div>
              <label className={labelClass}>Size &amp; Fit</label>
              <textarea value={sizeFit} onChange={e => setSizeFit(e.target.value)} rows={3}
                placeholder="Model measurements and sizing guidance…"
                className={textareaClass} />
            </div>
            <div>
              <label className={labelClass}>Delivery &amp; Returns</label>
              <textarea value={deliveryReturns} onChange={e => setDeliveryReturns(e.target.value)} rows={3}
                placeholder="Shipping and returns policy…"
                className={textareaClass} />
            </div>
          </div>
        </Section>

        {/* Notice about variants */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Variants &amp; Images</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Variant stock levels can be updated in the{" "}
              <Link href="/admin/inventory" className="underline font-medium">Inventory</Link> section.
              To add or remove variants and images, delete this product and create a new one.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pb-8">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
              font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors shadow-sm
              shadow-blue-500/25 disabled:opacity-60">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
          <Link href="/admin/products"
            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors px-4 py-2.5">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
