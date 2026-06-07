// src/app/admin/orders/page.tsx
// useSearchParams() must be inside a Suspense boundary in Next.js 14+

import { Suspense } from "react";
import OrdersContent from "./OrdersContent";

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-[11px] tracking-widest text-[#8a7a6a]">Loading orders…</div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
