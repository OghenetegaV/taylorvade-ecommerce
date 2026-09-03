// src/app/collection/page.tsx
// Directory of every shoppable collection: department (gender) cards up top,
// then every category as its own card with a live product image, linking to
// the matching /collections/{gender}?category={slug} listing. Fetches
// directly via Prisma (server component) — same pattern as the product page.

import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { prepareStorefrontCategories } from "@/lib/categoryOrder";

export const metadata = { title: "Collection — Taylor Vade" };

const GENDER_PATH: Record<string, string> = { WOMEN: "woman", MEN: "man", UNISEX: "unisex" };
const GENDER_LABEL: Record<string, string> = { WOMEN: "Woman", MEN: "Man", UNISEX: "Unisex" };

async function loadDepartments() {
  const genders = ["WOMEN", "MEN", "UNISEX"] as const;
  return Promise.all(
    genders.map(async gender => {
      const product = await prisma.product.findFirst({
        where: { gender, isPublished: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        include: { images: { where: { isPrimary: true }, take: 1 } },
      });
      return { gender, image: product?.images[0]?.url ?? null };
    })
  );
}

async function loadCategories() {
  const categories = await prisma.category.findMany({
    orderBy: [{ gender: "asc" }, { name: "asc" }],
    include: {
      products: {
        where: { isPublished: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 1,
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
    },
  });
  const shoppable = categories
    .filter(c => c.products.length > 0)
    .map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      gender: c.gender,
      image: c.products[0].images[0]?.url ?? null,
    }));

  // Reorder within each gender (New Arrival, Tops, Bottom, Outerwear, Set,
  // Essential, Tailoring last) while keeping the MEN → WOMEN → UNISEX grouping.
  const genderOrder = ["MEN", "WOMEN", "UNISEX"] as const;
  return genderOrder.flatMap(gender =>
    prepareStorefrontCategories(shoppable.filter(c => c.gender === gender))
  );
}

export default async function CollectionIndexPage() {
  const [departments, categories] = await Promise.all([loadDepartments(), loadCategories()]);

  return (
    <div className="bg-white min-h-screen font-serif">
      <div className="h-[76px] md:h-[88px]" />

      <div className="pt-4 md:pt-6 pb-10 md:pb-14 text-center px-5">
        <h1 className="text-[#111]" style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(30px, 4vw, 40px)" }}>
          Collection
        </h1>
        <p className="mt-2 text-[13.5px] tracking-[0.12em] text-[#8f8f8a]">
          Shop by Department &amp; Category
        </p>
      </div>

      {/* Departments */}
      <div className="px-3 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-1.5 mb-12 md:mb-16">
        {departments.map(d => (
          <Link key={d.gender} href={`/collections/${GENDER_PATH[d.gender]}`} className="group block">
            <div className="relative overflow-hidden bg-[#f5f5f4]" style={{ aspectRatio: "4/5" }}>
              {d.image && (
                <Image src={d.image} alt={GENDER_LABEL[d.gender]} fill
                  className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                  sizes="(min-width: 768px) 33vw, 100vw" />
              )}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white text-[16px] tracking-[0.2em] uppercase">
                {GENDER_LABEL[d.gender]}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-3 md:px-6 pb-20">
          <p className="text-[13px] tracking-[0.2em] uppercase text-[#8f8f8a] mb-4 md:mb-5">
            Shop by Category
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-1 md:gap-x-1.5 gap-y-6">
            {categories.map(c => (
              <Link key={c.id} href={`/collections/${GENDER_PATH[c.gender]}?category=${c.slug}`} className="group block">
                <div className="relative overflow-hidden bg-[#f5f5f4]" style={{ aspectRatio: "3/4" }}>
                  {c.image && (
                    <Image src={c.image} alt={c.name} fill
                      className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                      sizes="(min-width: 768px) 25vw, 50vw" />
                  )}
                </div>
                <p className="mt-3 px-1 text-[13px] tracking-[0.1em] uppercase text-[#111]">
                  {c.name}
                </p>
                <p className="px-1 text-[11.5px] tracking-[0.08em] text-[#8f8f8a]">
                  {GENDER_LABEL[c.gender]}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
