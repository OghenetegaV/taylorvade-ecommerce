// src/app/admin/inventory/page.tsx
import { Suspense } from "react";
import InventoryContent from "./InventoryContent";

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <InventoryContent />
    </Suspense>
  );
}
