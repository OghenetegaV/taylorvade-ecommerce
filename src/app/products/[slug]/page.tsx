// src/app/products/[slug]/page.tsx
// Fetches the product DIRECTLY from the database (Prisma) in the server
// component — no self-fetch to /api. This removes the fragile server→own-API
// HTTP hop (which 404s when NEXT_PUBLIC_APP_URL is unset or the server can't
// reach localhost) and is the standard Next.js App Router pattern.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductPage from "@/components/ProductPage";
import prisma from "@/lib/prisma";

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "One Size"];

// Single source of truth for loading a product + its "selected for you" list.
async function loadProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, isPublished: true },
    include: {
      category: {
        select: {
          id: true, name: true, slug: true,
          sizeChart: { select: { sizes: true } },
        },
      },
      images: { orderBy: { position: "asc" } },
      variants: {
        orderBy: [{ colorLabel: "asc" }, { size: "asc" }],
        include: { images: { orderBy: { position: "asc" } } },
      },
    },
  });

  if (!product) return null;

  const selectedForYou = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      isPublished: true,
      id: { not: product.id },
    },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  return { product, selectedForYou };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadProduct(slug);
  if (!data) return { title: "Product — Taylor Vade" };
  return {
    title: `${data.product.name} — Taylor Vade`,
    description:
      data.product.description ??
      `${data.product.name} — ${data.product.type}`,
  };
}

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadProduct(slug);

  if (!data) notFound();

  const { product, selectedForYou = [] } = data;

  // ── Build props from DB data ─────────────────────────────────────────
  const images = product.images
    .sort((a: any, b: any) => a.position - b.position)
    .map((img: any) => img.url as string);

  // Group variants by colorLabel to build swatch images.
  const colorMap = new Map<string, { src: string; colorLabel: string }>();
  product.images.forEach((img: any) => {
    if (img.variantId) {
      const variant = product.variants.find((v: any) => v.id === img.variantId);
      if (variant && !colorMap.has(variant.colorLabel)) {
        colorMap.set(variant.colorLabel, {
          src: img.url,
          colorLabel: variant.colorLabel,
        });
      }
    }
  });
  // If no variant-linked images, fall back to first image per unique color.
  if (colorMap.size === 0) {
    const seen = new Set<string>();
    product.variants.forEach((v: any) => {
      if (!seen.has(v.colorLabel)) {
        seen.add(v.colorLabel);
        colorMap.set(v.colorLabel, {
          src: images[0] ?? "",
          colorLabel: v.colorLabel,
        });
      }
    });
  }
  const swatchImages = [...colorMap.values()];

  // Unique sizes, sorted.
  const sizes: string[] = [
    ...new Set<string>(product.variants.map((v: any) => v.size as string)),
  ].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const relatedItems = selectedForYou.map((p: any) => ({
    slug: p.slug,
    image: p.images?.[0]?.url ?? "",
    name: p.name,
    description: p.type,
  }));

  return (
    <ProductPage
      name={product.name}
      colorLabel={product.variants[0]?.colorLabel ?? ""}
      type={product.type}
      price={Number(product.basePrice)}
      isNew={product.isNew}
      images={images}
      swatchImages={swatchImages}
      sizes={sizes}
      editorNotes={product.editorNotes ?? undefined}
      sizeFit={product.sizeFit ?? undefined}
      deliveryReturns={product.deliveryReturns ?? undefined}
      shopTheLook={[]}
      selectedForYou={relatedItems}
      productId={product.id}
      sizeChart={(product.category.sizeChart?.sizes as { label: string; values: Record<string, string> }[]) ?? null}
      variants={product.variants.map((v: any) => ({
        id: v.id,
        size: v.size,
        colorLabel: v.colorLabel,
        stockQuantity: v.stockQuantity,
        priceOverride: v.priceOverride ?? null,
      }))}
    />
  );
}
