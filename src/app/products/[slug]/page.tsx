// src/app/products/[slug]/page.tsx

import ProductPage from "@/components/ProductPage";

export default function SalimPage() {
  return (
    <ProductPage
      name="Salim"
      colorLabel="Brown/Cream"
      type="Contrast Raglan Shirt"
      price={90}
      isNew={true}
      images={[
        "/images/men.jpg",
        "/images/men.jpg",
        "/images/men.jpg",
      ]}
      swatchImages={[
        { src: "/images/men.jpg",   colorLabel: "Brown/Cream" },
        { src: "/images/women.jpg", colorLabel: "All White"   },
      ]}
      sizes={["XS", "S", "M", "L", "XL", "XXL"]}
      orderDeadline={{ hrs: 13, mins: 46, date: "1 June" }}
      editorNotes="A modern essential reimagined with contrast raglan sleeves and tonal button detailing. Cut from a premium cotton blend for a refined, relaxed silhouette."
      sizeFit="Model is 6ft 1in and wears a size M. We recommend sizing true to size for a regular fit, or up for a more relaxed look."
      deliveryReturns="Free UK delivery on orders over £150. Standard delivery £3.99. Free in-store returns. Postal returns £2.99. Items must be returned within 28 days in their original condition."
      shopTheLook={[
        { slug: "wide-leg-trousers-cream",    image: "/images/men.jpg",   name: "Wide Leg Trousers" },
        { slug: "square-frame-sunglasses",    image: "/images/women.jpg", name: "Square Frame Sunglasses" },
      ]}
      selectedForYou={[
        { slug: "product-1", image: "/images/men.jpg",   name: "Arlo",  description: "Baseball Shirt" },
        { slug: "product-2", image: "/images/men.jpg",   name: "Cleo",  description: "Slim Tee" },
        { slug: "product-3", image: "/images/men.jpg",   name: "Dante", description: "Cardigan" },
        { slug: "product-4", image: "/images/women.jpg", name: "Reid",  description: "Loafer" },
        { slug: "product-5", image: "/images/men.jpg",   name: "Marco", description: "Shirt" },
        { slug: "product-6", image: "/images/women.jpg", name: "Luca",  description: "Tee" },
      ]}
    />
  );
}