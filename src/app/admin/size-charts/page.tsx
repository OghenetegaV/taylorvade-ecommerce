// src/app/admin/size-charts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save, CheckCircle2 } from "lucide-react";

type Category = { id: string; name: string; gender: string; hasChart: boolean };
type Row = { label: string; values: Record<string, string> };

const inputClass = `w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm
  text-slate-800 placeholder:text-slate-400 outline-none
  focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all`;

function emptyRow(sizes: string[]): Row {
  return { label: "", values: Object.fromEntries(sizes.map(s => [s, ""])) };
}

// Ready-made international size templates (metric cm + UK/US/EU number
// equivalents) — Taylor Vade ships out of Nigeria but sells globally, so
// every template leads with the size-number conversions a US/UK/EU shopper
// needs before they ever look at a cm measurement. Loading a template just
// fills the draft below; nothing saves until "Save Chart" is pressed.
const TEMPLATES: Record<string, { sizeCols: string[]; rows: Row[] }> = {
  "Women's Tops & Dresses": {
    sizeCols: ["XS", "S", "M", "L", "XL", "XXL"],
    rows: [
      { label: "UK Size",    values: { XS: "6",  S: "8",  M: "10", L: "12",  XL: "14",  XXL: "16"  } },
      { label: "US Size",    values: { XS: "2",  S: "4",  M: "6",  L: "8",   XL: "10",  XXL: "12"  } },
      { label: "EU Size",    values: { XS: "34", S: "36", M: "38", L: "40",  XL: "42",  XXL: "44"  } },
      { label: "Bust (cm)",  values: { XS: "81", S: "86", M: "91", L: "97",  XL: "103", XXL: "109" } },
      { label: "Waist (cm)", values: { XS: "63", S: "68", M: "73", L: "79",  XL: "85",  XXL: "91"  } },
      { label: "Hip (cm)",   values: { XS: "89", S: "94", M: "99", L: "105", XL: "111", XXL: "117" } },
    ],
  },
  "Women's Bottoms": {
    sizeCols: ["XS", "S", "M", "L", "XL", "XXL"],
    rows: [
      { label: "UK Size",     values: { XS: "6",  S: "8",  M: "10", L: "12",  XL: "14",  XXL: "16"  } },
      { label: "US Size",     values: { XS: "2",  S: "4",  M: "6",  L: "8",   XL: "10",  XXL: "12"  } },
      { label: "EU Size",     values: { XS: "34", S: "36", M: "38", L: "40",  XL: "42",  XXL: "44"  } },
      { label: "Waist (cm)",  values: { XS: "63", S: "68", M: "73", L: "79",  XL: "85",  XXL: "91"  } },
      { label: "Hip (cm)",    values: { XS: "89", S: "94", M: "99", L: "105", XL: "111", XXL: "117" } },
      { label: "Inseam (cm)", values: { XS: "75", S: "76", M: "76", L: "77",  XL: "77",  XXL: "78"  } },
    ],
  },
  "Men's Tops & Outerwear": {
    sizeCols: ["XS", "S", "M", "L", "XL", "XXL"],
    rows: [
      { label: "UK/US Size",         values: { XS: "34", S: "36", M: "38", L: "40",  XL: "42",  XXL: "44"  } },
      { label: "EU Size",            values: { XS: "44", S: "46", M: "48", L: "50",  XL: "52",  XXL: "54"  } },
      { label: "Chest (cm)",         values: { XS: "86", S: "91", M: "96", L: "101", XL: "106", XXL: "111" } },
      { label: "Waist (cm)",         values: { XS: "71", S: "76", M: "81", L: "86",  XL: "91",  XXL: "96"  } },
      { label: "Neck (cm)",          values: { XS: "36", S: "38", M: "39", L: "41",  XL: "43",  XXL: "44"  } },
      { label: "Sleeve Length (cm)", values: { XS: "83", S: "84", M: "85", L: "86",  XL: "87",  XXL: "88"  } },
    ],
  },
  "Men's Bottoms": {
    sizeCols: ["XS", "S", "M", "L", "XL", "XXL"],
    rows: [
      { label: "Waist (in)",  values: { XS: "28", S: "30", M: "32", L: "34",  XL: "36",  XXL: "38"  } },
      { label: "Waist (cm)",  values: { XS: "71", S: "76", M: "81", L: "86",  XL: "91",  XXL: "96"  } },
      { label: "Hip (cm)",    values: { XS: "89", S: "94", M: "99", L: "104", XL: "109", XXL: "114" } },
      { label: "Inseam (cm)", values: { XS: "80", S: "81", M: "81", L: "82",  XL: "82",  XXL: "83"  } },
    ],
  },
};

// Best-guess template for a category, used by "Apply to all remaining
// categories" — bottoms keywords route to the *Bottoms template for that
// gender, everything else gets *Tops & Dresses/Outerwear. Unisex categories
// have no confident match (men's and women's blocks fit too differently) so
// they're left for manual assignment.
function guessTemplate(name: string, gender: string): string | null {
  const isBottom = /trouser|pant|jean|short|skirt|legging|jogger/i.test(name);
  if (gender === "WOMEN") return isBottom ? "Women's Bottoms" : "Women's Tops & Dresses";
  if (gender === "MEN")   return isBottom ? "Men's Bottoms" : "Men's Tops & Outerwear";
  return null;
}

export default function SizeChartsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [sizeCols, setSizeCols] = useState<string[]>(["XS", "S", "M", "L", "XL"]);
  const [rows, setRows] = useState<Row[]>([]);
  const [newSize, setNewSize] = useState("");
  const [loadingChart, setLoadingChart] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const refreshCategories = () =>
    fetch("/api/admin/categories").then(r => r.json()).then(d => {
      if (d.success) setCategories(d.data);
    });

  useEffect(() => { refreshCategories(); }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingChart(true);
    setSaved(false);
    setSaveError(null);
    fetch(`/api/admin/categories/${selectedId}/size-chart`).then(r => r.json()).then(d => {
      const chart = d.success ? d.data : null;
      if (chart?.sizes?.length) {
        const loadedRows: Row[] = chart.sizes;
        const cols = Array.from(new Set(loadedRows.flatMap(r => Object.keys(r.values))));
        setSizeCols(cols.length ? cols : ["XS", "S", "M", "L", "XL"]);
        setRows(loadedRows);
      } else {
        setSizeCols(["XS", "S", "M", "L", "XL"]);
        setRows([emptyRow(["XS", "S", "M", "L", "XL"])]);
      }
    }).finally(() => setLoadingChart(false));
  }, [selectedId]);

  function addRow() {
    setRows(prev => [...prev, emptyRow(sizeCols)]);
  }
  function removeRow(idx: number) {
    setRows(prev => prev.filter((_, i) => i !== idx));
  }
  function updateRowLabel(idx: number, label: string) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, label } : r));
  }
  function updateCell(idx: number, size: string, value: string) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, values: { ...r.values, [size]: value } } : r));
  }
  function addSizeCol() {
    const size = newSize.trim().toUpperCase();
    if (!size || sizeCols.includes(size)) return;
    setSizeCols(prev => [...prev, size]);
    setRows(prev => prev.map(r => ({ ...r, values: { ...r.values, [size]: "" } })));
    setNewSize("");
  }
  function removeSizeCol(size: string) {
    setSizeCols(prev => prev.filter(s => s !== size));
    setRows(prev => prev.map(r => {
      const { [size]: _drop, ...rest } = r.values;
      return { ...r, values: rest };
    }));
  }
  function applyTemplate(name: string) {
    const template = TEMPLATES[name];
    if (!template) return;
    setSizeCols(template.sizeCols);
    setRows(template.rows.map(r => ({ label: r.label, values: { ...r.values } })));
    setSaved(false);
    setSaveError(null);
  }

  async function handleSave() {
    if (!selectedId) return;
    const cleanRows = rows.filter(r => r.label.trim());
    if (cleanRows.length === 0) {
      setSaveError("Add at least one row with a measurement label (e.g. \"Chest (cm)\") before saving — blank-label rows aren't saved.");
      return;
    }
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/categories/${selectedId}/size-chart`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sizes: cleanRows }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error ?? "Could not save chart");
      setSaved(true);
      setCategories(prev => prev.map(c => c.id === selectedId ? { ...c, hasChart: true } : c));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save chart");
    } finally {
      setSaving(false);
    }
  }

  // One click to fill in every category that has no chart yet, using the
  // best-guess template for its gender/name. Existing charts are left alone.
  async function applyToAllRemaining() {
    const targets = categories.filter(c => !c.hasChart);
    if (targets.length === 0) return;
    setBulkRunning(true);
    setBulkResult(null);
    let applied = 0, skipped = 0;
    for (const c of targets) {
      const templateName = guessTemplate(c.name, c.gender);
      const template = templateName ? TEMPLATES[templateName] : null;
      if (!template) { skipped++; continue; }
      const res = await fetch(`/api/admin/categories/${c.id}/size-chart`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sizes: template.rows }),
      });
      const d = await res.json();
      if (d.success) applied++; else skipped++;
    }
    await refreshCategories();
    setBulkResult(
      `Applied a standard chart to ${applied} categor${applied === 1 ? "y" : "ies"}.` +
      (skipped ? ` Skipped ${skipped} (unisex or no confident match) — assign those manually.` : "")
    );
    setBulkRunning(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Size Charts</h1>
        {categories.some(c => !c.hasChart) && (
          <button onClick={applyToAllRemaining} disabled={bulkRunning}
            className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50">
            {bulkRunning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Apply standard charts to all remaining categories
          </button>
        )}
      </div>
      {bulkResult && <p className="text-xs text-slate-500">{bulkResult}</p>}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputClass}>
            <option value="">Select a category…</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.gender} — {c.name} {c.hasChart ? "✓ has chart" : "— no chart yet"}
              </option>
            ))}
          </select>
        </div>

        {selectedId && (loadingChart ? (
          <div className="text-sm text-slate-400 py-6 text-center">Loading…</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Quick start:</span>
              {Object.keys(TEMPLATES).map(name => (
                <button key={name} onClick={() => applyTemplate(name)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200
                    text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  {name}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase pb-2 pr-3">Measurement</th>
                    {sizeCols.map(size => (
                      <th key={size} className="text-center text-xs font-semibold text-slate-500 uppercase pb-2 px-1.5 min-w-[70px]">
                        <div className="flex items-center justify-center gap-1">
                          {size}
                          <button onClick={() => removeSizeCol(size)} className="text-slate-300 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </th>
                    ))}
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="py-1.5 pr-3">
                        <input value={row.label} onChange={e => updateRowLabel(idx, e.target.value)}
                          placeholder="e.g. Chest (in)" className={inputClass} />
                      </td>
                      {sizeCols.map(size => (
                        <td key={size} className="py-1.5 px-1.5">
                          <input value={row.values[size] ?? ""} onChange={e => updateCell(idx, size, e.target.value)}
                            className={`${inputClass} text-center`} />
                        </td>
                      ))}
                      <td className="text-center">
                        <button onClick={() => removeRow(idx)} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={addRow}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
              <div className="flex items-center gap-1.5">
                <input value={newSize} onChange={e => setNewSize(e.target.value)}
                  placeholder="New size (e.g. XXL)" className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs w-32" />
                <button onClick={addSizeCol}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                  <Plus className="w-3.5 h-3.5" /> Add Size
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                  font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Chart
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Saved
                </span>
              )}
              {saveError && (
                <span className="text-sm text-red-600">{saveError}</span>
              )}
            </div>
          </>
        ))}
      </div>
    </div>
  );
}
