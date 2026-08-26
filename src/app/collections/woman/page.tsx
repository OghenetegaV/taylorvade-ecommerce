// src/app/collections/woman/page.tsx
import { Suspense } from "react";
import CollectionPage from "@/components/CollectionPage";

export const metadata = { title: "Woman — Taylor Vade" };

export default function WomanPage() {
  return (
    <Suspense>
      <CollectionPage title="Women" gender="WOMEN" />
    </Suspense>
  );
}
