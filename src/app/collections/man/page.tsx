// src/app/collections/man/page.tsx
import { Suspense } from "react";
import CollectionPage from "@/components/CollectionPage";

export const metadata = { title: "Man — Taylor Vade" };

export default function ManPage() {
  return (
    <Suspense>
      <CollectionPage title="Men" gender="MEN" />
    </Suspense>
  );
}
