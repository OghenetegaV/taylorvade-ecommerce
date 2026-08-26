// src/app/size-guide/page.tsx
import prisma from "@/lib/prisma";

export const metadata = { title: "Size Guide — Taylor Vade" };

async function loadCharts() {
  const categories = await prisma.category.findMany({
    where: { sizeChart: { isNot: null } },
    include: { sizeChart: { select: { sizes: true } } },
    orderBy: [{ gender: "asc" }, { name: "asc" }],
  });
  return categories as (typeof categories[number] & {
    sizeChart: { sizes: { label: string; values: Record<string, string> }[] };
  })[];
}

export default async function SizeGuidePage() {
  const categories = await loadCharts();

  return (
    <div className="min-h-screen bg-[#faf9f7] font-serif">
      <div className="h-[76px] md:h-[88px]" />
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-12 md:py-16">
        <h1 className="text-[32px] md:text-[40px] text-[#1a1008] mb-8"
          style={{ fontFamily: "var(--font-script), cursive" }}>
          Size Guide
        </h1>

        {categories.length === 0 ? (
          <p className="text-[13.5px] text-[#5a4a3a]">
            Size charts are being added — check back soon, or see the Size &amp; Fit
            notes on individual product pages.
          </p>
        ) : (
          <div className="space-y-10">
            {categories.map(cat => {
              const rows = cat.sizeChart.sizes;
              const cols = Object.keys(rows[0]?.values ?? {});
              return (
                <div key={cat.id}>
                  <h2 className="text-[13px] tracking-[0.14em] uppercase text-[#1a1008] mb-3">
                    {cat.gender === "MEN" ? "Men — " : cat.gender === "WOMEN" ? "Women — " : ""}{cat.name}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12.5px] border-collapse">
                      <thead>
                        <tr className="border-b border-[#e8e2db]">
                          <th className="text-left py-2 pr-3 text-[#8a7a6a] uppercase tracking-[0.06em] text-[10.5px]">Measurement</th>
                          {cols.map(size => (
                            <th key={size} className="text-center py-2 px-2 text-[#8a7a6a] uppercase tracking-[0.06em] text-[10.5px]">
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
        )}
      </div>
    </div>
  );
}
