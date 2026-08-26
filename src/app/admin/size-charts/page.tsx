// src/app/admin/size-charts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save, CheckCircle2 } from "lucide-react";

type Category = { id: string; name: string; gender: string };
type Row = { label: string; values: Record<string, string> };

const inputClass = `w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm
  text-slate-800 placeholder:text-slate-400 outline-none
  focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all`;

function emptyRow(sizes: string[]): Row {
  return { label: "", values: Object.fromEntries(sizes.map(s => [s, ""])) };
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

  useEffect(() => {
    fetch("/api/admin/categories").then(r => r.json()).then(d => {
      if (d.success) setCategories(d.data);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingChart(true);
    setSaved(false);
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

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    setSaved(false);
    const cleanRows = rows.filter(r => r.label.trim());
    const res = await fetch(`/api/admin/categories/${selectedId}/size-chart`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sizes: cleanRows }),
    });
    const d = await res.json();
    setSaving(false);
    if (d.success) setSaved(true);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Size Charts</h1>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputClass}>
            <option value="">Select a category…</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.gender} — {c.name}</option>
            ))}
          </select>
        </div>

        {selectedId && (loadingChart ? (
          <div className="text-sm text-slate-400 py-6 text-center">Loading…</div>
        ) : (
          <>
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
            </div>
          </>
        ))}
      </div>
    </div>
  );
}
