// src/app/shipping-policy/page.tsx

import Link from "next/link";

export const metadata = {
  title: "Shipping Policy — Taylor Vade",
  description: "Delivery zones, timelines, and fees for Taylor Vade orders.",
};

const LAST_UPDATED = "9 June 2026";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="text-[12.5px] tracking-[0.25em] text-[#3a2e22] uppercase font-serif mb-5 pb-3
        border-b border-[#e8e2db]">
        {title}
      </h2>
      <div className="space-y-4 text-[14px] leading-[1.9] tracking-[0.03em] text-[#5a4a3a] font-serif">
        {children}
      </div>
    </section>
  );
}
function P({ children }: { children: React.ReactNode }) { return <p>{children}</p>; }

const ZONES = [
  { zone: "Lagos — Standard",       eta: "2–4 business days",  fee: "₦2,500" },
  { zone: "Lagos — Express",        eta: "24–48 hours",        fee: "₦4,500" },
  { zone: "Nationwide (Nigeria)",   eta: "3–7 business days",  fee: "₦4,000" },
  { zone: "International",         eta: "5–10 business days", fee: "₦45,000" },
];

export default function ShippingPolicyPage() {
  const sections = [
    { id: "zones",     label: "Delivery Zones & Fees" },
    { id: "processing", label: "Order Processing" },
    { id: "tracking",  label: "Tracking" },
    { id: "customs",   label: "International Duties" },
    { id: "issues",    label: "Delivery Issues" },
    { id: "contact",   label: "Contact Us" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5f2] font-serif">
      <div className="border-b border-[#e8e2db] bg-[#f7f5f2] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between">
          <Link href="/" className="text-[11.5px] tracking-[0.2em] text-[#9a8a7a] uppercase hover:text-[#3a2e22] transition-colors">
            ← Taylor Vade
          </Link>
          <span className="text-[21px] text-[#3a2e22]" style={{ fontFamily: "var(--font-script), cursive" }}>
            Taylor Vade
          </span>
          <span className="text-[11.5px] tracking-[0.15em] text-[#9a8a7a] uppercase hidden md:block">
            Shipping Policy
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 md:px-10 py-12 md:py-16">
        <div className="mb-14">
          <p className="text-[11.5px] tracking-[0.3em] text-[#9a8a7a] uppercase mb-3">Legal</p>
          <h1 className="text-[32px] md:text-[42px] text-[#3a2e22] leading-tight mb-4"
            style={{ fontFamily: "var(--font-script), cursive" }}>
            Shipping Policy
          </h1>
          <p className="text-[12.5px] tracking-[0.1em] text-[#9a8a7a] font-serif">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          <aside className="hidden md:block w-52 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-[10.5px] tracking-[0.25em] text-[#9a8a7a] uppercase mb-4">Contents</p>
              <nav className="space-y-1">
                {sections.map(s => (
                  <a key={s.id} href={`#${s.id}`}
                    className="block text-[12px] tracking-[0.06em] text-[#9a8a7a] hover:text-[#3a2e22] transition-colors py-0.5">
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <Section id="zones" title="Delivery Zones & Fees">
              <P>
                Exact delivery options and fees for your address are calculated live at checkout via our courier
                partner, Terminal Africa. If a live rate can&apos;t be reached, we fall back to the flat rates
                below:
              </P>
              <div className="overflow-x-auto">
                <table className="w-full text-[13.5px] border-collapse mt-2">
                  <thead>
                    <tr className="border-b border-[#e8e2db]">
                      <th className="text-left py-2 pr-3 text-[#8a7a6a] uppercase tracking-[0.06em] text-[12px]">Zone</th>
                      <th className="text-left py-2 pr-3 text-[#8a7a6a] uppercase tracking-[0.06em] text-[12px]">Estimated Delivery</th>
                      <th className="text-left py-2 text-[#8a7a6a] uppercase tracking-[0.06em] text-[12px]">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ZONES.map(z => (
                      <tr key={z.zone} className="border-b border-[#e8e2db]">
                        <td className="py-2.5 pr-3 text-[#3a2e22]">{z.zone}</td>
                        <td className="py-2.5 pr-3">{z.eta}</td>
                        <td className="py-2.5">{z.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <P>
                Orders over ₦250,000 qualify for free standard shipping within Nigeria. Delivery estimates begin
                from the date of dispatch, not the order date, and exclude weekends and public holidays.
              </P>
            </Section>

            <Section id="processing" title="Order Processing">
              <P>
                Orders are processed and dispatched within 1–2 business days of payment confirmation. During
                high-demand periods (sales, holidays), processing may take slightly longer — we&apos;ll notify you
                by email if there&apos;s a significant delay.
              </P>
            </Section>

            <Section id="tracking" title="Tracking">
              <P>
                Once your order ships, you&apos;ll receive a dispatch notification. You can view your order status
                at any time from your{" "}
                <Link href="/account/orders" className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                  order history
                </Link>.
              </P>
            </Section>

            <Section id="customs" title="International Duties">
              <P>
                For orders shipped outside Nigeria, the delivery fee shown at checkout covers freight only.
                Any customs duties, import taxes, or clearance fees charged by your country are the
                responsibility of the recipient and are not included in our shipping fee.
              </P>
            </Section>

            <Section id="issues" title="Delivery Issues">
              <P>
                If your order hasn&apos;t arrived within the estimated window, or arrives damaged, contact us with
                your order number and we&apos;ll investigate with the courier and make it right.
              </P>
            </Section>

            <Section id="contact" title="Contact Us">
              <div className="bg-white border border-[#e8e2db] p-6 space-y-2">
                <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase font-serif mb-3">
                  Taylor Vade — Customer Care
                </p>
                <p>
                  <span className="text-[#9a8a7a]">Email: </span>
                  <a href="mailto:orders@taylorvade.com" className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                    orders@taylorvade.com
                  </a>
                </p>
              </div>
            </Section>

            <div className="mt-16 pt-8 border-t border-[#e8e2db]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-[11.5px] tracking-[0.1em] text-[#9a8a7a]">
                  © {new Date().getFullYear()} Taylor Vade. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                  <Link href="/returns" className="text-[11.5px] tracking-[0.1em] text-[#9a8a7a] hover:text-[#3a2e22] transition-colors">
                    Returns
                  </Link>
                  <Link href="/terms" className="text-[11.5px] tracking-[0.1em] text-[#9a8a7a] hover:text-[#3a2e22] transition-colors">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
