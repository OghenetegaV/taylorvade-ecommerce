// src/app/admin/orders/page.tsx
import { Suspense } from "react";
import OrdersContent from "./OrdersContent";

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-[11px] tracking-widest text-[#8a7a6a] font-serif">
        Loading orders…
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
