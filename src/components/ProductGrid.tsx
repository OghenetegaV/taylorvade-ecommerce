import ProductCard, { ProductCardProps } from "@/components/ProductCard";

interface ProductGridProps {
  products: ProductCardProps[];
  columns?: 2 | 3 | 4;
}

export default function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  const colClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  }[columns];

  return (
    <div className={`grid ${colClass} gap-x-0.5 gap-y-5`}>
      {products.map(product => (
        <ProductCard key={product.slug} {...product} />
      ))}
    </div>
  );
}