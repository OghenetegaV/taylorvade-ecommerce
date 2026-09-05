// src/app/admin/products/new/page.tsx
// 5-step wizard: Basics → Content → Variants → Images → Publish
// Designed to feel light — one focused section at a time.

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, Loader2,
  UploadCloud, Star, AlertCircle, Sparkles, RefreshCw,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────
const STEPS = ["Basics", "Content", "Variants", "Images", "Publish"];
const SIZES   = ["XS", "S", "M", "L", "XL", "XXL"];
const GENDERS = [
  { value: "WOMEN",  label: "Women"  },
  { value: "MEN",    label: "Men"    },
  { value: "UNISEX", label: "Unisex" },
];

type Category   = { id: string; name: string; gender: string };
type ColorEntry = {
  key:   string;
  label: string;
  hex:   string;
  sizes: Record<string, { enabled: boolean; stock: string; sku: string }>;
};
type ImgEntry = { key: string; url: string; uploading: boolean; isPrimary: boolean };

// ── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function makeSku(productName: string, colorLabel: string, size: string) {
  const p = productName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "PROD";
  const c = colorLabel.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3)  || "COL";
  const sz = String(size).trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "SZ";
  // Short unique suffix so two products with the same name/colour/size can never
  // produce the same SKU (which caused "Unique constraint failed on sku").
  const suffix = uid().toUpperCase().slice(0, 4);
  return `TV-${p}-${c}-${sz}-${suffix}`;
}

function emptyColor(): ColorEntry {
  return {
    key:   uid(),
    label: "",
    hex:   "#8B7355",
    sizes: Object.fromEntries(
      SIZES.map(s => [s, { enabled: false, stock: "10", sku: "" }])
    ),
  };
}

// ── Shared styles ────────────────────────────────────────────────────────────
const inputClass = `w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm
  text-slate-800 placeholder:text-slate-400 outline-none
  focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all`;
const textareaClass = `${inputClass} resize-none`;
const labelClass = "block text-xs font-semibold text-slate-600 mb-1.5";

// ── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-300 ${
                done   ? "bg-emerald-500 text-white" :
                active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110" :
                         "bg-slate-100 text-slate-400"
              }`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[11.5px] font-semibold hidden sm:block ${
                active ? "text-blue-600" : done ? "text-emerald-600" : "text-slate-400"
              }`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors duration-300 ${
                done ? "bg-emerald-400" : "bg-slate-100"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function NewProductPage() {
  const router = useRouter();

  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Step 1 — Basics
  const [name,       setName]       = useState("");
  const [slug,       setSlug]       = useState("");
  const [slugTouched,setSlugTouched]= useState(false);
  const [type,       setType]       = useState("");
  const [basePrice,   setBasePrice]   = useState("");
  const [genders,     setGenders]     = useState<string[]>(["WOMEN"]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [newCat,      setNewCat]      = useState("");
  const [newCatGender, setNewCatGender] = useState("WOMEN");
  const [addingCat,   setAddingCat]   = useState(false);
  const [deletingCat, setDeletingCat] = useState<string | null>(null);

  function toggleGender(value: string) {
    setGenders(prev => {
      const next = prev.includes(value) ? prev.filter(g => g !== value) : [...prev, value];
      // Drop categories that no longer belong to any selected gender.
      setCategoryIds(ids => ids.filter(id => {
        const cat = categories.find(c => c.id === id);
        return cat ? next.includes(cat.gender) : true;
      }));
      return next;
    });
  }

  function toggleCategory(id: string) {
    setCategoryIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  // Step 2 — Content
  const [description,     setDescription]     = useState("");
  const [editorNotes,     setEditorNotes]     = useState("");
  const [sizeFit,         setSizeFit]         = useState("");
  const [deliveryReturns, setDeliveryReturns] = useState("");

  // Step 3 — Variants (colour-first)
  const [colors, setColors] = useState<ColorEntry[]>([emptyColor()]);

  // Step 4 — Images
  const [images,   setImages]   = useState<ImgEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  // Step 5 — Publish
  const [isPublished, setIsPublished] = useState(true);
  const [isNew,       setIsNew]       = useState(true);
  const [isFeatured,  setIsFeatured]  = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories").then(r => r.json()).then(d => {
      if (d.success) setCategories(d.data);
    });
  }, []);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // ── Category quick-add ─────────────────────────────────────────────
  async function handleAddCategory() {
    if (!newCat.trim()) return;
    setAddingCat(true);
    const r = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat, gender: newCatGender }),
    });
    const d = await r.json();
    if (d.success) {
      setCategories(prev => [...prev, d.data]);
      setCategoryIds(prev => [...prev, d.data.id]);
      if (!genders.includes(newCatGender)) setGenders(prev => [...prev, newCatGender]);
      setNewCat("");
    } else alert(d.error ?? "Failed to create category");
    setAddingCat(false);
  }

  async function handleDeleteCategory(id: string, catName: string) {
    if (!confirm(`Delete category "${catName}"?\nThis only works if no products use it.`)) return;
    setDeletingCat(id);
    const r = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (d.success) {
      setCategories(prev => prev.filter(c => c.id !== id));
      setCategoryIds(prev => prev.filter(c => c !== id));
    } else {
      alert(d.error ?? "Failed to delete category");
    }
    setDeletingCat(null);
  }

  // ── Colour helpers ─────────────────────────────────────────────────
  function updateColor(key: string, patch: Partial<Pick<ColorEntry, "label" | "hex">>) {
    setColors(prev => prev.map(c => c.key === key ? { ...c, ...patch } : c));
  }
  function toggleSize(key: string, size: string) {
    setColors(prev => prev.map(c => {
      if (c.key !== key) return c;
      const cur = c.sizes[size];
      const enabled = !cur.enabled;
      return {
        ...c,
        sizes: {
          ...c.sizes,
          [size]: {
            ...cur,
            enabled,
            sku: enabled && !cur.sku ? makeSku(name, c.label, size) : cur.sku,
          },
        },
      };
    }));
  }
  function setSizeField(key: string, size: string, field: "stock" | "sku", value: string) {
    setColors(prev => prev.map(c =>
      c.key === key
        ? { ...c, sizes: { ...c.sizes, [size]: { ...c.sizes[size], [field]: value } } }
        : c
    ));
  }
  function enableAllSizes(key: string) {
    setColors(prev => prev.map(c => {
      if (c.key !== key) return c;
      return {
        ...c,
        sizes: Object.fromEntries(SIZES.map(s => [s, {
          ...c.sizes[s],
          enabled: true,
          sku: c.sizes[s].sku || makeSku(name, c.label, s),
        }])),
      };
    }));
  }
  function regenSkus(key: string) {
    setColors(prev => prev.map(c => {
      if (c.key !== key) return c;
      return {
        ...c,
        sizes: Object.fromEntries(SIZES.map(s => [s, {
          ...c.sizes[s],
          sku: c.sizes[s].enabled ? makeSku(name, c.label, s) : c.sizes[s].sku,
        }])),
      };
    }));
  }

  // ── Image helpers ──────────────────────────────────────────────────
  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    for (const file of arr) {
      const key = uid();
      setImages(prev => [...prev, { key, url: "", uploading: true, isPrimary: prev.length === 0 }]);
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "products");
      try {
        const r = await fetch("/api/upload", { method: "POST", body: form });
        const d = await r.json();
        if (d.success) {
          setImages(prev => prev.map(img => img.key === key ? { ...img, url: d.data.url, uploading: false } : img));
        } else {
          setImages(prev => prev.filter(img => img.key !== key));
          alert(d.error ?? "Upload failed");
        }
      } catch {
        setImages(prev => prev.filter(img => img.key !== key));
        alert("Upload failed — check your connection");
      }
    }
  }
  function addUrlImage() {
    if (!urlInput.trim()) return;
    setImages(prev => [...prev, { key: uid(), url: urlInput.trim(), uploading: false, isPrimary: prev.length === 0 }]);
    setUrlInput("");
  }
  function removeImage(key: string) {
    setImages(prev => {
      const next = prev.filter(img => img.key !== key);
      if (next.length && !next.some(i => i.isPrimary)) next[0].isPrimary = true;
      return [...next];
    });
  }
  function setPrimary(key: string) {
    setImages(prev => prev.map(img => ({ ...img, isPrimary: img.key === key })));
  }

  // ── Validation per step ────────────────────────────────────────────
  function stepError(s: number): string | null {
    if (s === 0) {
      if (!name.trim())      return "Product name is required.";
      if (!type.trim())      return "Product type is required.";
      if (!basePrice || parseFloat(basePrice) <= 0) return "Enter a valid price.";
      if (genders.length === 0) return "Select at least one gender.";
      if (categoryIds.length === 0) return "Select or create at least one category.";
      return null;
    }
    if (s === 2) {
      if (colors.length === 0) return "Add at least one colour.";
      for (const c of colors) {
        if (!c.label.trim()) return "Every colour needs a name.";
        const enabled = SIZES.filter(sz => c.sizes[sz].enabled);
        if (enabled.length === 0) return `Select at least one size for "${c.label}".`;
        for (const sz of enabled) {
          if (!c.sizes[sz].sku.trim()) return `SKU missing for ${c.label} / ${sz}.`;
        }
      }
      return null;
    }
    if (s === 3) {
      if (images.length === 0)            return "Add at least one product image.";
      if (images.some(i => i.uploading))  return "Wait for uploads to finish.";
      return null;
    }
    return null;
  }

  function next() {
    const err = stepError(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError(null);
    setStep(s => Math.max(s - 1, 0));
  }

  // ── Submit ─────────────────────────────────────────────────────────
  async function handleSubmit() {
    for (let s = 0; s < STEPS.length; s++) {
      const err = stepError(s);
      if (err) { setError(err); setStep(s); return; }
    }
    setSaving(true);
    setError(null);

    const variants = colors.flatMap(c =>
      SIZES.filter(sz => c.sizes[sz].enabled).map(sz => ({
        colorLabel:    c.label.trim(),
        colorHex:      c.hex,
        size:          sz,
        sku:           c.sizes[sz].sku.trim(),
        stockQuantity: c.sizes[sz].stock || "0",
        priceOverride: "",
      }))
    );

    const imagePayload = images.map((img, i) => ({
      url:       img.url,
      altText:   name,
      position:  i,
      isPrimary: img.isPrimary,
    }));

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(), slug, type: type.trim(),
        description, editorNotes, sizeFit, deliveryReturns,
        basePrice: parseFloat(basePrice), genders, categoryIds,
        isNew, isFeatured, isPublished,
        variants, images: imagePayload,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (data.success) router.push("/admin/products");
    else setError(data.error ?? "Failed to create product.");
  }

  const totalVariants = colors.reduce(
    (n, c) => n + SIZES.filter(sz => c.sizes[sz].enabled).length, 0
  );

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto pb-16">

      <Link href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500
          hover:text-slate-800 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <StepIndicator current={step} />

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200
          rounded-xl px-4 py-3 text-sm text-red-700 mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-7">

        {/* ════ STEP 1 — BASICS ════ */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">The essentials</h2>
              <p className="text-sm text-slate-500 mt-0.5">Just the core details to get started.</p>
            </div>

            <div>
              <label className={labelClass}>Product Name <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Salim" className={inputClass} autoFocus />
              {slug && (
                <p className="text-[12.5px] text-slate-400 mt-1.5">
                  URL: /products/<span className="font-medium text-slate-500">{slug}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Product Type <span className="text-red-500">*</span></label>
                <input type="text" value={type} onChange={e => setType(e.target.value)}
                  placeholder="e.g. Contrast Raglan Shirt" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Base Price (₦) <span className="text-red-500">*</span></label>
                <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)}
                  min="0" step="0.01" placeholder="45000" className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Gender <span className="text-red-500">*</span></label>
              <p className="text-[12px] text-slate-400 mb-1.5">Select every collection this product should appear under.</p>
              <div className="grid grid-cols-3 gap-2">
                {GENDERS.map(g => (
                  <button key={g.value} type="button"
                    onClick={() => toggleGender(g.value)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      genders.includes(g.value)
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                    }`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Categories <span className="text-red-500">*</span></label>
              {categories.filter(c => genders.includes(c.gender)).length === 0 ? (
                <p className="text-xs text-slate-400 py-1.5">
                  {genders.length === 0 ? "Pick a gender above first." : "No categories yet for the selected gender(s) — create one below."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => genders.includes(c.gender)).map(c => {
                    const selected = categoryIds.includes(c.id);
                    return (
                      <div key={c.id}
                        className={`group flex items-center rounded-xl border transition-all overflow-hidden ${
                          selected
                            ? "bg-blue-600 border-blue-600 shadow-sm shadow-blue-500/25"
                            : "bg-white border-slate-200 hover:border-blue-300"
                        }`}>
                        <button type="button" onClick={() => toggleCategory(c.id)}
                          className={`pl-3.5 pr-2 py-2 text-xs font-semibold transition-colors ${
                            selected ? "text-white" : "text-slate-600"
                          }`}>
                          {c.name}
                          <span className={`ml-1 text-[10.5px] uppercase ${
                            selected ? "text-blue-200" : "text-slate-400"
                          }`}>{c.gender}</span>
                        </button>
                        <button type="button"
                          disabled={deletingCat === c.id}
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          title="Delete category"
                          className={`pr-2.5 pl-1 py-2 transition-all ${
                            selected
                              ? "text-blue-200 hover:text-white"
                              : "text-slate-300 hover:text-red-500"
                          }`}>
                          {deletingCat === c.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <label className={labelClass}>Add a New Category</label>
                <p className="text-[12px] text-slate-400 mb-2">
                  Pick the gender it belongs to, name it, then add it — it'll be checked above automatically.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select value={newCatGender} onChange={e => setNewCatGender(e.target.value)}
                    className={`${inputClass} w-full sm:w-[130px] sm:flex-shrink-0`}>
                    {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                  <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)}
                    placeholder="e.g. Outerwear"
                    className={`${inputClass} w-full sm:flex-1`} />
                  <button type="button" disabled={addingCat || !newCat.trim()} onClick={handleAddCategory}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white
                      text-xs font-semibold hover:bg-slate-700 transition-colors disabled:opacity-40
                      w-full sm:w-auto sm:flex-shrink-0">
                    {addingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ STEP 2 — CONTENT ════ */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tell the story</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                All optional — you can fill these in later from the Edit page.
              </p>
            </div>

            <div>
              <label className={labelClass}>Short Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                placeholder="Shown under the product name in collection listings…"
                className={textareaClass} />
            </div>
            <div>
              <label className={labelClass}>Editor&apos;s Notes</label>
              <textarea value={editorNotes} onChange={e => setEditorNotes(e.target.value)} rows={4}
                placeholder="The detailed description shown in the product page accordion…"
                className={textareaClass} />
            </div>
            <div>
              <label className={labelClass}>Size &amp; Fit</label>
              <textarea value={sizeFit} onChange={e => setSizeFit(e.target.value)} rows={3}
                placeholder="Model measurements, fit guidance…" className={textareaClass} />
            </div>
            <div>
              <label className={labelClass}>Delivery &amp; Returns</label>
              <textarea value={deliveryReturns} onChange={e => setDeliveryReturns(e.target.value)} rows={3}
                placeholder="Shipping options, returns policy…" className={textareaClass} />
            </div>
          </div>
        )}

        {/* ════ STEP 3 — VARIANTS ════ */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Colours &amp; sizes</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Add each colour, then tick the sizes it comes in. SKUs are generated automatically.
              </p>
            </div>

            {colors.map((color, ci) => {
              const enabledSizes = SIZES.filter(sz => color.sizes[sz].enabled);
              return (
                <div key={color.key} className="border border-slate-200 rounded-2xl p-4 space-y-4">
                  {/* Colour header */}
                  <div className="flex items-center gap-3">
                    <label className="relative cursor-pointer flex-shrink-0">
                      <input type="color" value={color.hex}
                        onChange={e => updateColor(color.key, { hex: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer" />
                      <span className="block w-10 h-10 rounded-xl border-2 border-white shadow-md"
                        style={{ backgroundColor: color.hex }} />
                    </label>
                    <input type="text" value={color.label}
                      onChange={e => updateColor(color.key, { label: e.target.value })}
                      placeholder={`Colour name, e.g. Brown/Cream`}
                      className={`${inputClass} flex-1`} />
                    {colors.length > 1 && (
                      <button type="button"
                        onClick={() => setColors(prev => prev.filter(c => c.key !== color.key))}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Size checkboxes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-600">Available sizes</p>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => enableAllSizes(color.key)}
                          className="text-[12.5px] font-semibold text-blue-600 hover:text-blue-700">
                          All sizes
                        </button>
                        {enabledSizes.length > 0 && (
                          <button type="button" onClick={() => regenSkus(color.key)}
                            className="flex items-center gap-1 text-[12.5px] font-semibold text-slate-500 hover:text-slate-700"
                            title="Regenerate SKUs from current name + colour">
                            <RefreshCw className="w-3 h-3" /> Regen SKUs
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {SIZES.map(sz => {
                        const on = color.sizes[sz].enabled;
                        return (
                          <button key={sz} type="button" onClick={() => toggleSize(color.key, sz)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              on
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                            }`}>
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock + SKU per enabled size */}
                  {enabledSizes.length > 0 && (
                    <div className="space-y-2">
                      <div className="hidden sm:grid grid-cols-[44px_1fr_90px] gap-2 px-1">
                        <p className="text-[11.5px] font-semibold text-slate-400 uppercase">Size</p>
                        <p className="text-[11.5px] font-semibold text-slate-400 uppercase">SKU</p>
                        <p className="text-[11.5px] font-semibold text-slate-400 uppercase">Stock</p>
                      </div>
                      {enabledSizes.map(sz => (
                        <div key={sz} className="grid grid-cols-[44px_1fr_90px] gap-2 items-center">
                          <span className="text-xs font-bold text-slate-700 text-center bg-slate-100
                            rounded-lg py-2">{sz}</span>
                          <input type="text" value={color.sizes[sz].sku}
                            onChange={e => setSizeField(color.key, sz, "sku", e.target.value)}
                            className={`${inputClass} !py-2 !text-xs font-mono`} />
                          <input type="number" min="0" value={color.sizes[sz].stock}
                            onChange={e => setSizeField(color.key, sz, "stock", e.target.value)}
                            className={`${inputClass} !py-2 !text-xs text-center`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <button type="button" onClick={() => setColors(prev => [...prev, emptyColor()])}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed
                border-slate-200 rounded-2xl py-3.5 text-sm font-semibold text-slate-500
                hover:border-blue-300 hover:text-blue-600 transition-all">
              <Plus className="w-4 h-4" /> Add Another Colour
            </button>

            {totalVariants > 0 && (
              <p className="text-xs text-slate-400 text-center">
                {totalVariants} variant{totalVariants !== 1 ? "s" : ""} will be created
              </p>
            )}
          </div>
        )}

        {/* ════ STEP 4 — IMAGES ════ */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Product images</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Drop files below or paste URLs. Star one image as the primary.
              </p>
            </div>

            {/* Drop zone */}
            <label
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false);
                if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
              }}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed
                rounded-2xl py-10 cursor-pointer transition-all ${
                dragOver
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
              }`}>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <UploadCloud className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Drop images here or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs text-slate-400">PNG, JPG, WEBP — multiple files welcome</p>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => e.target.files?.length && uploadFiles(e.target.files)} />
            </label>

            {/* URL input */}
            <div className="flex gap-2">
              <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addUrlImage())}
                placeholder="…or paste an image URL"
                className={`${inputClass} flex-1`} />
              <button type="button" onClick={addUrlImage} disabled={!urlInput.trim()}
                className="px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold
                  hover:bg-slate-700 transition-colors disabled:opacity-40">
                Add
              </button>
            </div>

            {/* Image grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map(img => (
                  <div key={img.key} className="relative group rounded-xl overflow-hidden
                    border border-slate-200 bg-slate-50" style={{ aspectRatio: "2/3" }}>
                    {img.uploading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="w-full h-full object-cover object-top" />
                        {/* Primary badge / set-primary */}
                        <button type="button" onClick={() => setPrimary(img.key)}
                          className={`absolute top-1.5 left-1.5 p-1 rounded-lg transition-all ${
                            img.isPrimary
                              ? "bg-amber-400 text-white"
                              : "bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-amber-400"
                          }`}
                          title={img.isPrimary ? "Primary image" : "Set as primary"}>
                          <Star className="w-3 h-3" fill={img.isPrimary ? "currentColor" : "none"} />
                        </button>
                        {/* Remove */}
                        <button type="button" onClick={() => removeImage(img.key)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/40 text-white
                            opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ STEP 5 — PUBLISH ════ */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Review &amp; publish</h2>
              <p className="text-sm text-slate-500 mt-0.5">One last look before it goes live.</p>
            </div>

            {/* Summary */}
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2.5">
              {[
                ["Name",     name || "—"],
                ["Type",     type || "—"],
                ["Price",    basePrice ? `₦${Number(basePrice).toLocaleString()}` : "—"],
                ["Gender",   genders.map(g => GENDERS.find(x => x.value === g)?.label ?? g).join(", ") || "—"],
                ["Categories", categories.filter(c => categoryIds.includes(c.id)).map(c => c.name).join(", ") || "—"],
                ["Colours",  colors.map(c => c.label).filter(Boolean).join(", ") || "—"],
                ["Variants", String(totalVariants)],
                ["Images",   String(images.length)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{k}</span>
                  <span className="text-sm font-medium text-slate-800 text-right">{v}</span>
                </div>
              ))}
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              {[
                { label: "Publish immediately", desc: "Product will be visible on the store", val: isPublished, set: setIsPublished },
                { label: "New In badge",        desc: "Shows the 'New In' tag on cards",       val: isNew,       set: setIsNew       },
                { label: "Featured",            desc: "Highlight in featured sections",        val: isFeatured,  set: setIsFeatured  },
              ].map(({ label, desc, val, set }) => (
                <button key={label} type="button" onClick={() => set(!val)}
                  className="w-full flex items-center justify-between gap-4 p-3.5 rounded-xl
                    border border-slate-200 hover:border-blue-300 transition-all text-left">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-0.5 transition-colors flex-shrink-0 ${
                    val ? "bg-blue-600" : "bg-slate-200"
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      val ? "translate-x-4" : ""
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
          {step > 0 ? (
            <button type="button" onClick={back}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-500
                hover:text-slate-800 transition-colors px-3 py-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <span />}

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors
                shadow-sm shadow-blue-500/25">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600
                hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold
                px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/30
                disabled:opacity-60">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                : <><Sparkles className="w-4 h-4" /> Create Product</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
