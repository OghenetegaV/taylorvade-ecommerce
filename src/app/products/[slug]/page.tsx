// src/app/products/[slug]/page.tsx
// Fetches product from API and passes to ProductPage component.
// Falls back to static props for any product not yet in the database.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductPage from "@/components/ProductPage";

const SIZE_ORDER = ["XXS","XS","S","M","L","XL","XXL","XXXL","One Size"];

async function getProduct(slug: string) {
  try {
    // Use absolute URL for server-side fetch
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res  = await fetch(`${base}/api/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: "Product — Taylor Vade" };
  return {
    title: `${data.product.name} — Taylor Vade`,
    description: data.product.description ?? `${data.product.name} — ${data.product.type}`,
  };
}

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProduct(slug);

  if (!data) notFound();

  const { product, selectedForYou = [] } = data;

  // ── Build props from DB data ─────────────────────────────────────────
  const images = product.images
    .sort((a: any, b: any) => a.position - b.position)
    .map((img: any) => img.url as string);

  // Group variants by colorLabel to build swatch images
  const colorMap = new Map<string, { src: string; colorLabel: string }>();
  product.images.forEach((img: any) => {
    if (img.variantId) {
      const variant = product.variants.find((v: any) => v.id === img.variantId);
      if (variant && !colorMap.has(variant.colorLabel)) {
        colorMap.set(variant.colorLabel, {
          src:        img.url,
          colorLabel: variant.colorLabel,
        });
      }
    }
  });
  // If no variant-linked images, fall back to first image per unique color
  if (colorMap.size === 0) {
    const seen = new Set<string>();
    product.variants.forEach((v: any) => {
      if (!seen.has(v.colorLabel)) {
        seen.add(v.colorLabel);
        colorMap.set(v.colorLabel, {
          src:        images[0] ?? "",
          colorLabel: v.colorLabel,
        });
      }
    });
  }
  const swatchImages = [...colorMap.values()];

  // Unique sizes, sorted
  const sizes = [...new Set(product.variants.map((v: any) => v.size as string))]
    .sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a);
      const bi = SIZE_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const relatedItems = selectedForYou.map((p: any) => ({
    slug:        p.slug,
    image:       p.images?.[0]?.url ?? "",
    name:        p.name,
    description: p.type,
  }));

  return (
    <ProductPage
      name            = {product.name}
      colorLabel      = {product.variants[0]?.colorLabel ?? ""}
      type            = {product.type}
      price           = {Number(product.basePrice)}
      isNew           = {product.isNew}
      images          = {images}
      swatchImages    = {swatchImages}
      sizes           = {sizes}
      editorNotes     = {product.editorNotes ?? undefined}
      sizeFit         = {product.sizeFit ?? undefined}
      deliveryReturns = {product.deliveryReturns ?? undefined}
      shopTheLook     = {[]}
      selectedForYou  = {relatedItems}
      productId       = {product.id}
      variants        = {product.variants.map((v: any) => ({
        id:            v.id,
        size:          v.size,
        colorLabel:    v.colorLabel,
        stockQuantity: v.stockQuantity,
        priceOverride: v.priceOverride ?? null,
      }))}
    />
  );
}
