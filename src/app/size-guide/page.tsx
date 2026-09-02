// src/app/size-guide/page.tsx
import prisma from "@/lib/prisma";
import SizeGuideBrowser from "./SizeGuideBrowser";

export const metadata = { title: "Size Guide — Taylor Vade" };

async function loadCharts() {
  const categories = await prisma.category.findMany({
    where: { sizeChart: { isNot: null } },
    include: { sizeChart: { select: { sizes: true } } },
    orderBy: [{ gender: "asc" }, { name: "asc" }],
  });
  return categories
    .filter(c => Array.isArray(c.sizeChart?.sizes) && c.sizeChart.sizes.length > 0)
    .map(c => ({
      id: c.id,
      name: c.name,
      gender: c.gender,
      sizes: c.sizeChart!.sizes as { label: string; values: Record<string, string> }[],
    }));
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
          <p className="text-[15px] text-[#5a4a3a]">
            Size charts are being added — check back soon, or see the Size &amp; Fit
            notes on individual product pages.
          </p>
        ) : (
          <SizeGuideBrowser categories={categories} />
        )}
      </div>
    </div>
  );
}
