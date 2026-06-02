// src/app/collections/mens-new-in/page.tsx  — example usage

import CollectionPage from "@/components/CollectionPage";

const products = [
  {
    slug: "baseball-collar-shirt-brown",
    name: "Arlo",
    description: "Baseball Collar Contrast Trim Shirt in Brown",
    price: 95,
    isNew: true,
    image: "/images/men.jpg",
    swatches: [{ color: "#2a1a0a" }, { color: "#f5f0e8" }],
  },
  {
    slug: "slim-fit-tee-cream",
    name: "Cleo",
    description: "Slim Fit Ribbed T-Shirt in Cream",
    price: 55,
    isNew: true,
    image: "/images/men.jpg",
    swatches: [{ color: "#f5f0e8" }, { color: "#1a1008" }],
  },
  {
    slug: "broderie-cardigan-brown",
    name: "Dante",
    description: "Broderie Anglaise Cardigan in Dark Brown",
    price: 140,
    isNew: true,
    image: "/images/men.jpg",
    swatches: [{ color: "#2a1a0a" }],
  },
  {
    slug: "suede-buckle-loafer-brown",
    name: "Reid",
    description: "Suede Buckle Loafer in Dark Brown",
    price: 185,
    isNew: true,
    image: "/images/men.jpg",
    swatches: [{ color: "#2a1a0a" }, { color: "#1a1008" }],
  },
];

export default function MensNewIn() {
  return <CollectionPage title="New In" products={products} />;
}