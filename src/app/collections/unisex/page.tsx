// src/app/collections/unisex/page.tsx
import { Suspense } from "react";
import CollectionPage from "@/components/CollectionPage";

export const metadata = { title: "Unisex — Taylor Vade" };

export default function UnisexPage() {
  return (
    <Suspense>
      <CollectionPage title="Unisex" gender="UNISEX" />
    </Suspense>
  );
}
