import ProductGrid from "@/components/ProductGrid";

const products = [
  {
    slug: "faith-dress",
    name: "Faith",
    description: "Cap Sleeve Corset Cotton Midi Dress in White",
    price: 170,
    isNew: true,
    notifyMe: true,
    image: "/images/faith.jpg",
    swatches: [
      { color: "#d4cfc8", label: "Stone" },
      { color: "#1a1008", label: "Black" },
      { color: "#ffffff", label: "White" },
    ],
  },
];

export default function CollectionsPage() {
  return (
    <main className="px-4 py-0">
      <ProductGrid products={products} columns={4} />
    </main>
  );
}