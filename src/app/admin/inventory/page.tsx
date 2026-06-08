// src/app/admin/inventory/page.tsx
import { Suspense } from "react";
import InventoryContent from "./InventoryContent";

export default function AdminInventoryPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-[11px] tracking-widest text-[#8a7a6a] font-serif">
        Loading inventory…
      </div>
    }>
      <InventoryContent />
    </Suspense>
  );
}
