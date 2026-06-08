import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

const STATUS_COLORS: Record<string, string> = {
  PENDING:"bg-amber-100 text-amber-800", PAID:"bg-blue-100 text-blue-800",
  PROCESSING:"bg-purple-100 text-purple-800", SHIPPED:"bg-indigo-100 text-indigo-800",
  DELIVERED:"bg-green-100 text-green-800", CANCELLED:"bg-red-100 text-red-800",
};

function fmt(n: number, cur: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: cur, minimumFractionDigits: 0 }).format(n);
}

export default async function OrdersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { profileId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      address: { select: { fullName: true, city: true, country: true } },
      items: {
        include: {
          product: {
            select: {
              name: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
          variant: { select: { colorLabel: true, size: true } },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#f7f5f2] font-serif">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="mb-8">
          <Link href="/account" className="text-[10px] tracking-[0.15em] text-[#8a7a6a] hover:text-[#1a1008] transition-colors">← My Account</Link>
          <h1 className="text-[30px] text-[#1a1008] mt-2" style={{ fontFamily: "var(--font-script), cursive" }}>Order History</h1>
          <p className="text-[11px] text-[#8a7a6a] mt-0.5">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-[#e8e2db] p-12 text-center">
            <p className="text-[12px] text-[#8a7a6a] tracking-wide mb-5">No orders yet.</p>
            <Link href="/" className="inline-block border border-[#1a1008] px-6 py-2.5 text-[10.5px] tracking-[0.15em] uppercase text-[#1a1008] hover:bg-[#1a1008] hover:text-white transition-colors">Shop Now</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white border border-[#e8e2db]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0eeeb]">
                  <div>
                    <p className="text-[11px] font-mono text-[#1a1008]">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-[10px] text-[#8a7a6a] mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                    <p className="text-[12px] font-medium text-[#1a1008] mt-1.5">
                      {fmt(Number(order.totalAmount), order.currency)}
                    </p>
                  </div>
                </div>
                <div className="px-6 py-4 space-y-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      {item.product.images[0] && (
                        <div className="relative w-12 h-16 flex-shrink-0 overflow-hidden bg-[#f0eeeb]">
                          <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover object-top" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-[#1a1008] truncate">{item.product.name}</p>
                        <p className="text-[10.5px] text-[#8a7a6a] mt-0.5">
                          {item.variant.colorLabel} · {item.variant.size} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="text-[12px] text-[#1a1008] flex-shrink-0">
                        {fmt(Number(item.total), order.currency)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-3 border-t border-[#f0eeeb]">
                  <p className="text-[10.5px] text-[#8a7a6a]">
                    {order.address.fullName} · {order.address.city}, {order.address.country}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
