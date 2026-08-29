// src/app/terms/page.tsx

import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Taylor Vade",
  description: "The terms governing your use of taylorvade.com and any purchase made through it.",
};

const LAST_UPDATED = "9 June 2026";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="text-[13px] tracking-[0.2em] text-[#3a2e22] uppercase font-serif font-semibold mb-5 pb-3
        border-b border-[#e8e2db]">
        {title}
      </h2>
      <div className="space-y-4 text-[14px] leading-[1.9] tracking-[0.03em] text-[#3a2e22] font-serif">
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
          <span className="mt-[7px] w-1 h-1 rounded-full bg-[#6b5c4a] flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  const sections = [
    { id: "acceptance",  label: "Acceptance of Terms" },
    { id: "eligibility", label: "Eligibility" },
    { id: "account",     label: "Your Account" },
    { id: "orders",      label: "Orders & Pricing" },
    { id: "payment",     label: "Payment" },
    { id: "shipping",    label: "Shipping" },
    { id: "returns",     label: "Returns" },
    { id: "ip",          label: "Intellectual Property" },
    { id: "conduct",     label: "Acceptable Use" },
    { id: "liability",   label: "Limitation of Liability" },
    { id: "law",         label: "Governing Law" },
    { id: "changes",     label: "Changes to These Terms" },
    { id: "contact",     label: "Contact Us" },
  ];

  return (
    <div className="min-h-screen bg-[#ece2d0] font-serif">
      <div className="h-[76px] md:h-[88px]" />

      <div className="max-w-5xl mx-auto px-5 md:px-14 py-12 md:py-16 md:bg-[#f7f5f2] md:shadow-[0_0_50px_rgba(58,46,34,0.06)]">
        <div className="mb-14">
          <p className="text-[11.5px] tracking-[0.3em] text-[#6b5c4a] uppercase mb-3">Legal</p>
          <h1 className="text-[32px] md:text-[42px] text-[#3a2e22] leading-tight mb-4"
            style={{ fontFamily: "var(--font-script), cursive" }}>
            Terms of Service
          </h1>
          <p className="text-[12.5px] tracking-[0.1em] text-[#6b5c4a] font-serif">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          <aside className="hidden md:block w-52 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-[10.5px] tracking-[0.25em] text-[#6b5c4a] uppercase mb-4">Contents</p>
              <nav className="space-y-1">
                {sections.map(s => (
                  <a key={s.id} href={`#${s.id}`}
                    className="block text-[12px] tracking-[0.06em] text-[#6b5c4a] hover:text-[#3a2e22] transition-colors py-0.5">
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <Section id="acceptance" title="Acceptance of Terms">
              <P>
                These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of taylorvade.com
                (the &ldquo;Site&rdquo;) and any purchase you make through it. By browsing the Site, creating an
                account, or placing an order, you agree to be bound by these Terms. If you do not agree, please
                do not use the Site.
              </P>
            </Section>

            <Section id="eligibility" title="Eligibility">
              <P>
                You must be at least 18 years old, or the age of legal majority in your jurisdiction, to place an
                order. By ordering, you confirm that you meet this requirement and that the information you provide
                is accurate and complete.
              </P>
            </Section>

            <Section id="account" title="Your Account">
              <P>
                You may check out as a guest or create an account. If you create an account, you are responsible
                for keeping your login credentials confidential and for all activity that occurs under your
                account. Contact us immediately if you suspect unauthorised use of your account.
              </P>
            </Section>

            <Section id="orders" title="Orders & Pricing">
              <Ul items={[
                "All prices are displayed in Nigerian Naira (₦) unless otherwise noted; any other currency shown while browsing is an estimate for convenience only and is not what you are charged",
                "We reserve the right to refuse or cancel any order, including in cases of suspected fraud, pricing errors, or stock unavailability",
                "An order is confirmed only once payment has been successfully processed and you receive an order confirmation email",
                "Product images are representative — slight variations in colour or finish may occur due to display settings or the nature of the materials used",
              ]} />
            </Section>

            <Section id="payment" title="Payment">
              <P>
                Payments are processed securely through Paystack. We do not collect or store your card details —
                these are handled directly by our payment processor in compliance with PCI-DSS standards. Your
                order will not be fulfilled until payment is confirmed.
              </P>
            </Section>

            <Section id="shipping" title="Shipping">
              <P>
                Delivery timelines and fees are calculated at checkout based on your delivery address and are shown
                before you pay. Please see our{" "}
                <Link href="/shipping-policy" className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                  Shipping Policy
                </Link>{" "}
                for full details. Risk of loss and title for items purchased pass to you upon delivery to the
                carrier.
              </P>
            </Section>

            <Section id="returns" title="Returns">
              <P>
                Our returns and refunds process is set out in full in our{" "}
                <Link href="/returns" className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                  Return &amp; Refund Policy
                </Link>. By placing an order, you agree to the terms of that policy.
              </P>
            </Section>

            <Section id="ip" title="Intellectual Property">
              <P>
                All content on the Site — including the Taylor Vade name, logo, product designs, photography, and
                text — is owned by or licensed to Taylor Vade and protected by applicable intellectual property
                laws. You may not reproduce, distribute, or create derivative works from this content without our
                prior written consent.
              </P>
            </Section>

            <Section id="conduct" title="Acceptable Use">
              <P>You agree not to:</P>
              <Ul items={[
                "Use the Site for any unlawful purpose or in violation of these Terms",
                "Attempt to gain unauthorised access to our systems, other users' accounts, or non-public areas of the Site",
                "Interfere with or disrupt the Site's operation, including via automated scraping, bots, or excessive requests",
                "Submit false, fraudulent, or misleading information, including payment or delivery details",
              ]} />
            </Section>

            <Section id="liability" title="Limitation of Liability">
              <P>
                To the fullest extent permitted by law, Taylor Vade shall not be liable for any indirect,
                incidental, or consequential damages arising from your use of the Site or purchase of our products.
                Our total liability for any claim relating to an order is limited to the amount you paid for that
                order. Nothing in these Terms excludes liability that cannot be excluded under applicable law.
              </P>
            </Section>

            <Section id="law" title="Governing Law">
              <P>
                These Terms are governed by the laws of the Federal Republic of Nigeria. Any dispute arising from
                these Terms or your use of the Site shall be subject to the exclusive jurisdiction of the Nigerian
                courts, without prejudice to any mandatory consumer-protection rights you may have in your own
                country of residence.
              </P>
            </Section>

            <Section id="changes" title="Changes to These Terms">
              <P>
                We may update these Terms from time to time. Material changes will be reflected in the
                &ldquo;Last updated&rdquo; date above. Continued use of the Site after changes are posted
                constitutes acceptance of the revised Terms.
              </P>
            </Section>

            <Section id="contact" title="Contact Us">
              <P>Questions about these Terms can be sent to:</P>
              <div className="bg-white border border-[#e8e2db] p-6 space-y-2">
                <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase font-serif mb-3">
                  Taylor Vade
                </p>
                <p>
                  <span className="text-[#6b5c4a]">Email: </span>
                  <a href="mailto:contact@taylorvade.com" className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                    contact@taylorvade.com
                  </a>
                </p>
              </div>
            </Section>

            <div className="mt-16 pt-8 border-t border-[#e8e2db]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-[11.5px] tracking-[0.1em] text-[#6b5c4a]">
                  © {new Date().getFullYear()} Taylor Vade. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                  <Link href="/privacy" className="text-[11.5px] tracking-[0.1em] text-[#6b5c4a] hover:text-[#3a2e22] transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/returns" className="text-[11.5px] tracking-[0.1em] text-[#6b5c4a] hover:text-[#3a2e22] transition-colors">
                    Returns
                  </Link>
                  <Link href="/cookies" className="text-[11.5px] tracking-[0.1em] text-[#6b5c4a] hover:text-[#3a2e22] transition-colors">
                    Cookie Policy
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
