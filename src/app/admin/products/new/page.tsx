// src/app/admin/products/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; gender: string };
type Variant   = {
  colorLabel: string; colorHex: string; size: string;
  sku: string; stockQuantity: string; priceOverride: string;
};
type ImgEntry  = { url: string; altText: string; isPrimary: boolean; variantId: string };

const SIZES    = ["XS","S","M","L","XL","XXL","XXXL","One Size"];
const GENDERS  = ["MEN","WOMEN","UNISEX"];

const emptyVariant: Variant = {
  colorLabel: "", colorHex: "#000000", size: "M",
  sku: "", stockQuantity: "0", priceOverride: "",
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e8e2db] rounded-lg p-6">
      <h3 className="text-[10px] tracking-[0.2em] text-[#8a7a6a] uppercase font-serif mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.15em] text-[#8a7a6a] uppercase mb-1.5 font-serif">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full border border-[#e8e2db] px-4 py-2.5 text-[12px] text-[#1a1008] outline-none focus:border-[#1a1008] transition-colors font-serif bg-white";
const textareaClass = `${inputClass} resize-none`;

export default function NewProductPage() {
  const router = useRouter();

  // ── State ─────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Basic info
  const [name,            setName]            = useState("");
  const [slug,            setSlug]            = useState("");
  const [slugManual,      setSlugManual]      = useState(false);
  const [type,            setType]            = useState("");
  const [description,     setDescription]     = useState("");
  const [editorNotes,     setEditorNotes]     = useState("");
  const [sizeFit,         setSizeFit]         = useState("");
  const [deliveryReturns, setDeliveryReturns] = useState("");
  const [basePrice,       setBasePrice]       = useState("");
  const [gender,          setGender]          = useState("UNISEX");
  const [categoryId,      setCategoryId]      = useState("");

  // Flags
  const [isNew,       setIsNew]       = useState(false);
  const [isFeatured,  setIsFeatured]  = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Variants
  const [variants, setVariants] = useState<Variant[]>([{ ...emptyVariant }]);

  // Images (URLs — uploaded separately via /api/upload or pasted)
  const [images,        setImages]        = useState<ImgEntry[]>([{ url:"", altText:"", isPrimary:true, variantId:"" }]);
  const [uploadingIdx,  setUploadingIdx]  = useState<number | null>(null);

  // New category inline
  const [newCatName,   setNewCatName]   = useState("");
  const [newCatGender, setNewCatGender] = useState("UNISEX");
  const [addingCat,    setAddingCat]    = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories").then(r => r.json()).then(d => {
      if (d.success) setCategories(d.data);
    });
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManual) setSlug(slugify(name));
  }, [name, slugManual]);

  // ── Variant helpers ────────────────────────────────────────────────
  function updateVariant(i: number, field: keyof Variant, value: string) {
    setVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  }

  function addVariant() {
    setVariants(prev => [...prev, { ...emptyVariant }]);
  }

  function removeVariant(i: number) {
    if (variants.length === 1) return;
    setVariants(prev => prev.filter((_, idx) => idx !== i));
  }

  function duplicateVariant(i: number) {
    const copy = { ...variants[i], sku: "" };
    setVariants(prev => [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)]);
  }

  // ── Image helpers ──────────────────────────────────────────────────
  function updateImage(i: number, field: keyof ImgEntry, value: any) {
    setImages(prev => prev.map((img, idx) => {
      if (idx === i) return { ...img, [field]: value };
      if (field === "isPrimary" && value === true) return { ...img, isPrimary: false };
      return img;
    }));
  }

  function addImage() {
    setImages(prev => [...prev, { url:"", altText:"", isPrimary:false, variantId:"" }]);
  }

  function removeImage(i: number) {
    if (images.length === 1) return;
    setImages(prev => prev.filter((_, idx) => idx !== i));
  }

  async function uploadImage(i: number, file: File) {
    setUploadingIdx(i);
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "products");
    const r = await fetch("/api/upload", { method: "POST", body: form });
    const d = await r.json();
    if (d.success) updateImage(i, "url", d.data.url);
    else alert(d.error ?? "Upload failed");
    setUploadingIdx(null);
  }

  // ── Add category inline ────────────────────────────────────────────
  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    const r = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName, gender: newCatGender }),
    });
    const d = await r.json();
    if (d.success) {
      setCategories(prev => [...prev, d.data]);
      setCategoryId(d.data.id);
      setNewCatName("");
    } else {
      alert(d.error ?? "Failed to create category");
    }
    setAddingCat(false);
  }

  // ── Submit ─────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !type || !basePrice || !categoryId) {
      setError("Please fill in all required fields (Name, Type, Price, Category).");
      return;
    }
    if (variants.some(v => !v.colorLabel || !v.size || !v.sku)) {
      setError("All variants must have a Colour, Size, and SKU.");
      return;
    }
    if (images.some(img => !img.url.trim())) {
      setError("All image entries must have a URL. Remove empty rows or upload an image.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/products", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, slug, type, description, editorNotes, sizeFit, deliveryReturns,
        basePrice: parseFloat(basePrice), gender, categoryId,
        isNew, isFeatured, isPublished,
        variants, images,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (data.success) {
      router.push("/admin/products");
    } else {
      setError(data.error ?? "Failed to create product.");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 font-serif max-w-4xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-[10px] tracking-[0.15em] text-[#8a7a6a] hover:text-[#1a1008] transition-colors">
          ← Products
        </button>
        <h1 className="text-[20px] md:text-[22px] text-[#1a1008] tracking-wide mt-2">Add New Product</h1>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-[11.5px] text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Basic Info ── */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Product Name" required>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="e.g. Salim" className={inputClass} />
            </Field>
            <Field label="Slug (URL)" required>
              <input type="text" value={slug}
                onChange={e => { setSlug(slugify(e.target.value)); setSlugManual(true); }}
                placeholder="auto-generated from name" className={inputClass} />
              <p className="text-[10px] text-[#8a7a6a] mt-1">
                Will appear at: /products/<strong>{slug || "..."}</strong>
              </p>
            </Field>
            <Field label="Product Type" required>
              <input type="text" value={type} onChange={e => setType(e.target.value)} required
                placeholder="e.g. Contrast Raglan Shirt" className={inputClass} />
            </Field>
            <Field label="Base Price (₦)" required>
              <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} required
                min="0" step="0.01" placeholder="e.g. 45000" className={inputClass} />
            </Field>
            <Field label="Gender">
              <select value={gender} onChange={e => setGender(e.target.value)} className={inputClass}>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Category" required>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass} required>
                <option value="">Select a category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.gender})</option>)}
              </select>
              <div className="flex gap-2 mt-2">
                <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  placeholder="New category name" className="flex-1 border border-[#e8e2db] px-3 py-1.5 text-[11px] outline-none focus:border-[#1a1008] font-serif" />
                <select value={newCatGender} onChange={e => setNewCatGender(e.target.value)}
                  className="border border-[#e8e2db] px-2 py-1.5 text-[11px] outline-none font-serif bg-white">
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <button type="button" disabled={addingCat || !newCatName.trim()} onClick={handleAddCategory}
                  className="border border-[#1a1008] px-3 py-1.5 text-[10px] tracking-wide text-[#1a1008]
                    hover:bg-[#1a1008] hover:text-white transition-colors disabled:opacity-40">
                  {addingCat ? "…" : "Add"}
                </button>
              </div>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Short Description">
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={2} placeholder="Brief product description shown in listings…" className={textareaClass} />
            </Field>
          </div>
        </Section>

        {/* ── Flags ── */}
        <Section title="Status & Labels">
          <div className="flex flex-wrap gap-6">
            {[
              { label:"Published (visible on site)", val:isPublished, set:setIsPublished },
              { label:"New In (shows 'New In' badge)",  val:isNew,       set:setIsNew },
              { label:"Featured",                       val:isFeatured,  set:setIsFeatured },
            ].map(({ label, val, set }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={val} onChange={e => set(e.target.checked)}
                  className="w-4 h-4 accent-[#1a1008]" />
                <span className="text-[11.5px] text-[#3a2e22]">{label}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* ── Product page content ── */}
        <Section title="Product Page Content">
          <div className="space-y-4">
            <Field label="Editor's Notes (accordion on product page)">
              <textarea value={editorNotes} onChange={e => setEditorNotes(e.target.value)} rows={3}
                placeholder="e.g. A modern essential reimagined with contrast raglan sleeves…"
                className={textareaClass} />
            </Field>
            <Field label="Size & Fit">
              <textarea value={sizeFit} onChange={e => setSizeFit(e.target.value)} rows={2}
                placeholder="e.g. Model is 6ft 1in and wears a size M. We recommend sizing true to size…"
                className={textareaClass} />
            </Field>
            <Field label="Delivery & Returns">
              <textarea value={deliveryReturns} onChange={e => setDeliveryReturns(e.target.value)} rows={2}
                placeholder="e.g. Free UK delivery on orders over £150. Returns within 28 days…"
                className={textareaClass} />
            </Field>
          </div>
        </Section>

        {/* ── Variants ── */}
        <Section title="Variants (Colour × Size)">
          <p className="text-[10.5px] text-[#8a7a6a] mb-4">
            Each row is one Colour + Size combination. Add one row per size per colour.
          </p>

          {/* Header - desktop only */}
          <div className="hidden md:grid grid-cols-[1fr_80px_90px_120px_80px_100px_auto] gap-2 mb-2">
            {["Colour Label","Hex","Size","SKU","Stock","Price Override",""].map(h => (
              <p key={h} className="text-[9.5px] tracking-[0.15em] text-[#8a7a6a] uppercase">{h}</p>
            ))}
          </div>

          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="p-3 border border-[#e8e2db] rounded md:p-0 md:border-0">
                {/* Mobile label */}
                <p className="md:hidden text-[10px] tracking-[0.1em] text-[#8a7a6a] uppercase mb-2">
                  Variant {i + 1}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-[1fr_80px_90px_120px_80px_100px_auto] gap-2">
                  <div>
                    <label className="md:hidden text-[9.5px] text-[#8a7a6a] tracking-wide block mb-1">Colour Label</label>
                    <input type="text" value={v.colorLabel} placeholder="Brown/Cream"
                      onChange={e => updateVariant(i, "colorLabel", e.target.value)}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="md:hidden text-[9.5px] text-[#8a7a6a] tracking-wide block mb-1">Hex</label>
                    <input type="color" value={v.colorHex}
                      onChange={e => updateVariant(i, "colorHex", e.target.value)}
                      className="w-full h-[42px] border border-[#e8e2db] cursor-pointer bg-white" />
                  </div>
                  <div>
                    <label className="md:hidden text-[9.5px] text-[#8a7a6a] tracking-wide block mb-1">Size</label>
                    <select value={v.size} onChange={e => updateVariant(i, "size", e.target.value)}
                      className={inputClass}>
                      {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="md:hidden text-[9.5px] text-[#8a7a6a] tracking-wide block mb-1">SKU</label>
                    <input type="text" value={v.sku} placeholder="TV-SALIM-BROWN-M"
                      onChange={e => updateVariant(i, "sku", e.target.value)}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="md:hidden text-[9.5px] text-[#8a7a6a] tracking-wide block mb-1">Stock</label>
                    <input type="number" value={v.stockQuantity} min="0"
                      onChange={e => updateVariant(i, "stockQuantity", e.target.value)}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="md:hidden text-[9.5px] text-[#8a7a6a] tracking-wide block mb-1">Price Override</label>
                    <input type="number" value={v.priceOverride} min="0" step="0.01"
                      placeholder="Optional"
                      onChange={e => updateVariant(i, "priceOverride", e.target.value)}
                      className={inputClass} />
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 md:col-span-1">
                    <button type="button" onClick={() => duplicateVariant(i)} title="Duplicate"
                      className="text-[10px] text-[#8a7a6a] hover:text-[#1a1008] border border-[#e8e2db] px-2 py-1.5 hover:border-[#1a1008] transition-colors">
                      ⊕
                    </button>
                    <button type="button" onClick={() => removeVariant(i)} title="Remove"
                      disabled={variants.length === 1}
                      className="text-[10px] text-red-400 hover:text-red-600 border border-[#e8e2db] px-2 py-1.5 hover:border-red-300 transition-colors disabled:opacity-30">
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addVariant}
            className="mt-3 border border-dashed border-[#c8c0b8] px-4 py-2 text-[10.5px]
              tracking-wide text-[#8a7a6a] hover:border-[#1a1008] hover:text-[#1a1008]
              transition-colors w-full text-center">
            + Add Variant Row
          </button>

          <div className="mt-3 bg-[#faf9f7] border border-[#e8e2db] rounded p-3">
            <p className="text-[10px] text-[#8a7a6a] tracking-wide">
              <strong className="text-[#1a1008]">Tip:</strong> Use the ⊕ button to duplicate a row, then just change the Size.
              For example: add "Brown/Cream" in XS, duplicate 5 times, then change each to S, M, L, XL, XXL.
            </p>
          </div>
        </Section>

        {/* ── Images ── */}
        <Section title="Product Images">
          <p className="text-[10.5px] text-[#8a7a6a] mb-4">
            Upload images or paste URLs. The first image (marked Primary) will show in product listings.
          </p>

          <div className="space-y-3">
            {images.map((img, i) => (
              <div key={i} className="border border-[#e8e2db] rounded p-3">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
                  <div>
                    <label className="block text-[9.5px] tracking-[0.15em] text-[#8a7a6a] uppercase mb-1">
                      Image URL
                    </label>
                    <div className="flex gap-2">
                      <input type="text" value={img.url} placeholder="https://… or upload below"
                        onChange={e => updateImage(i, "url", e.target.value)}
                        className="flex-1 border border-[#e8e2db] px-3 py-2 text-[11px] outline-none focus:border-[#1a1008] font-serif bg-white" />
                      <label className={`border border-[#c8c0b8] px-3 py-2 text-[10px] cursor-pointer
                        hover:border-[#1a1008] transition-colors flex items-center whitespace-nowrap ${
                          uploadingIdx === i ? "opacity-50 pointer-events-none" : ""
                        }`}>
                        {uploadingIdx === i ? "Uploading…" : "Upload"}
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => e.target.files?.[0] && uploadImage(i, e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9.5px] tracking-[0.15em] text-[#8a7a6a] uppercase mb-1">Alt text</label>
                    <input type="text" value={img.altText} placeholder="Description"
                      onChange={e => updateImage(i, "altText", e.target.value)}
                      className="w-full border border-[#e8e2db] px-3 py-2 text-[11px] outline-none focus:border-[#1a1008] font-serif bg-white" />
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer self-end pb-2">
                    <input type="radio" name="primaryImage" checked={img.isPrimary}
                      onChange={() => updateImage(i, "isPrimary", true)}
                      className="accent-[#1a1008]" />
                    <span className="text-[10.5px] text-[#3a2e22] whitespace-nowrap">Primary</span>
                  </label>
                  <button type="button" onClick={() => removeImage(i)} disabled={images.length === 1}
                    className="text-red-400 hover:text-red-600 border border-[#e8e2db] px-2 py-2
                      hover:border-red-300 transition-colors disabled:opacity-30 self-end text-[12px]">
                    ×
                  </button>
                </div>

                {/* Preview */}
                {img.url && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={img.url} alt="preview" className="w-14 h-20 object-cover object-top border border-[#e8e2db]" />
                    <p className="text-[10px] text-green-600">✓ Image loaded</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button type="button" onClick={addImage}
            className="mt-3 border border-dashed border-[#c8c0b8] px-4 py-2 text-[10.5px]
              tracking-wide text-[#8a7a6a] hover:border-[#1a1008] hover:text-[#1a1008]
              transition-colors w-full text-center">
            + Add Image Row
          </button>
        </Section>

        {/* ── Submit ── */}
        <div className="flex gap-3 pb-12">
          <button type="submit" disabled={saving}
            className="bg-[#1a1008] text-white text-[11px] tracking-[0.2em] uppercase
              px-8 py-3.5 hover:bg-[#3a2e22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Creating product…" : "Create Product"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border border-[#e8e2db] text-[11px] tracking-[0.15em] uppercase
              px-6 py-3.5 text-[#8a7a6a] hover:border-[#1a1008] hover:text-[#1a1008] transition-colors">
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}
