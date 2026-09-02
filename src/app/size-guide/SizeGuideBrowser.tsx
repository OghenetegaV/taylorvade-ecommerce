// src/app/size-guide/SizeGuideBrowser.tsx
"use client";

import { useMemo, useState } from "react";

type Chart = {
  id: string;
  name: string;
  gender: string;
  sizes: { label: string; values: Record<string, string> }[];
};

const GENDER_TABS: { label: string; value: string }[] = [
  { label: "All",   value: "ALL" },
  { label: "Women", value: "WOMEN" },
  { label: "Men",   value: "MEN" },
  { label: "Unisex", value: "UNISEX" },
];

const PAGE_SIZE = 5;

export default function SizeGuideBrowser({ categories }: { categories: Chart[] }) {
  const [search, setSearch]   = useState("");
  const [gender, setGender]   = useState("ALL");
  const [page,   setPage]     = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter(c => {
      if (gender !== "ALL" && c.gender !== gender) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categories, search, gender]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by category name…"
            className="w-full border border-[#d9cfc2] bg-white rounded-[6px] pl-4 pr-4 py-2.5
              text-[14px] text-[#1a1008] font-sans outline-none focus:border-[#1a1008]
              transition-colors placeholder:text-[#8a7a6a]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {GENDER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setGender(tab.value); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-[12.5px] tracking-[0.06em] uppercase font-sans transition-colors ${
                gender === tab.value
                  ? "bg-[#1a1008] text-white"
                  : "bg-white border border-[#d9cfc2] text-[#5a4a3a] hover:border-[#1a1008]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[15px] text-[#5a4a3a]">
          No size charts match &quot;{search}&quot;. Try a different search or category.
        </p>
      ) : (
        <>
          <div className="space-y-10">
            {pageItems.map(cat => {
              const rows = cat.sizes;
              const cols = Object.keys(rows[0]?.values ?? {});
              return (
                <div key={cat.id}>
                  <h2 className="text-[14.5px] tracking-[0.14em] uppercase text-[#1a1008] mb-3">
                    {cat.gender === "MEN" ? "Men — " : cat.gender === "WOMEN" ? "Women — " : ""}{cat.name}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[14px] border-collapse">
                      <thead>
                        <tr className="border-b border-[#e8e2db]">
                          <th className="text-left py-2 pr-3 text-[#8a7a6a] uppercase tracking-[0.06em] text-[12px]">Measurement</th>
                          {cols.map(size => (
                            <th key={size} className="text-center py-2 px-2 text-[#8a7a6a] uppercase tracking-[0.06em] text-[12px]">
                              {size}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(row => (
                          <tr key={row.label} className="border-b border-[#e8e2db]">
                            <td className="py-2 pr-3 text-[#3a2e22]">{row.label}</td>
                            {cols.map(size => (
                              <td key={size} className="text-center py-2 px-2 text-[#5a4a3a]">
                                {row.values[size] || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-[#e8e2db]">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-[12.5px] tracking-[0.08em] uppercase text-[#1a1008]
                  underline underline-offset-4 disabled:opacity-30 disabled:no-underline disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-[12.5px] text-[#8a7a6a]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-[12.5px] tracking-[0.08em] uppercase text-[#1a1008]
                  underline underline-offset-4 disabled:opacity-30 disabled:no-underline disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
