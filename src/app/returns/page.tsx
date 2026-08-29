// src/app/returns/page.tsx

import Link from "next/link";

export const metadata = {
  title: "Return & Refund Policy — Taylor Vade",
  description: "How to return or exchange an order, and how refunds are processed.",
};

const LAST_UPDATED = "9 June 2026";
// NOTE: return window, condition rules, and who pays return shipping are
// placeholders — confirm the real policy with Taylor Vade before publishing.
const RETURN_WINDOW_DAYS = 14;

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
function Ul({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 ml-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-[7px] w-1 h-1 rounded-full bg-[#9a8a7a] flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ReturnsPage() {
  const sections = [
    { id: "window",    label: "Return Window" },
    { id: "condition", label: "Condition Requirements" },
    { id: "exclusions", label: "Non-Returnable Items" },
    { id: "how",       label: "How to Start a Return" },
    { id: "refunds",   label: "Refunds" },
    { id: "exchanges", label: "Exchanges" },
    { id: "faulty",    label: "Faulty or Incorrect Items" },
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
            Return &amp; Refund Policy
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 md:px-10 py-12 md:py-16">
        <div className="mb-14">
          <p className="text-[11.5px] tracking-[0.3em] text-[#9a8a7a] uppercase mb-3">Legal</p>
          <h1 className="text-[32px] md:text-[42px] text-[#3a2e22] leading-tight mb-4"
            style={{ fontFamily: "var(--font-script), cursive" }}>
            Return &amp; Refund Policy
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
            <Section id="window" title="Return Window">
              <P>
                We want you to love your Taylor Vade pieces. If something isn&apos;t right, you may request a
                return within <strong>{RETURN_WINDOW_DAYS} days</strong> of delivery. The item must be received
                back by us within this window; the return is initiated by contacting us as described below.
              </P>
            </Section>

            <Section id="condition" title="Condition Requirements">
              <P>To be eligible for a return, items must be:</P>
              <Ul items={[
                "Unworn, unwashed, and undamaged, with all original tags attached",
                "Returned in their original packaging where possible",
                "Free of any odour (perfume, smoke) or marks",
              ]} />
              <P>
                Items that do not meet these conditions may be declined and sent back to you at your cost.
              </P>
            </Section>

            <Section id="exclusions" title="Non-Returnable Items">
              <Ul items={[
                "Underwear, swimwear, and other items marked as final sale for hygiene reasons",
                "Made-to-order or customised/tailored pieces",
                "Gift cards",
                "Items marked “Final Sale” at the time of purchase",
              ]} />
            </Section>

            <Section id="how" title="How to Start a Return">
              <P>
                Email{" "}
                <a href="mailto:orders@taylorvade.com" className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                  orders@taylorvade.com
                </a>{" "}
                with your order number and the item(s) you&apos;d like to return. We&apos;ll confirm eligibility
                and send you return instructions, including the address to send the item back to.
              </P>
              <P>
                Unless the return is due to our error (wrong or faulty item), return shipping costs are the
                customer&apos;s responsibility. We recommend using a trackable shipping method, as we cannot
                issue a refund for items lost in transit back to us.
              </P>
            </Section>

            <Section id="refunds" title="Refunds">
              <P>
                Once we receive and inspect your return, we&apos;ll notify you by email whether it has been
                approved. Approved refunds are issued to your original payment method via Paystack within 7–10
                business days. Original delivery fees are non-refundable unless the return is due to our error.
              </P>
            </Section>

            <Section id="exchanges" title="Exchanges">
              <P>
                We currently process exchanges as a return followed by a new order, so the item you want doesn&apos;t
                sell out while your return is in transit. Place a new order for the item/size you&apos;d like, and
                we&apos;ll refund the original once it&apos;s received back.
              </P>
            </Section>

            <Section id="faulty" title="Faulty or Incorrect Items">
              <P>
                If you receive a faulty, damaged, or incorrect item, contact us within {RETURN_WINDOW_DAYS} days of
                delivery with your order number and a photo of the issue. We&apos;ll arrange a free return and a
                full refund or replacement, whichever you prefer.
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
                  <Link href="/shipping-policy" className="text-[11.5px] tracking-[0.1em] text-[#9a8a7a] hover:text-[#3a2e22] transition-colors">
                    Shipping Policy
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
