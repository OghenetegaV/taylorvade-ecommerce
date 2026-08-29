// src/app/privacy/page.tsx

import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Taylor Vade",
  description: "How Taylor Vade collects, uses, and protects your personal information.",
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

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

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

export default function PrivacyPolicyPage() {
  const sections = [
    { id: "overview",      label: "Overview" },
    { id: "collection",    label: "Data We Collect" },
    { id: "use",           label: "How We Use Your Data" },
    { id: "sharing",       label: "Data Sharing" },
    { id: "cookies",       label: "Cookies" },
    { id: "retention",     label: "Data Retention" },
    { id: "rights",        label: "Your Rights" },
    { id: "security",      label: "Security" },
    { id: "third-parties", label: "Third-Party Services" },
    { id: "children",      label: "Children's Privacy" },
    { id: "changes",       label: "Policy Changes" },
    { id: "contact",       label: "Contact Us" },
  ];

  return (
    <div className="min-h-screen bg-[#ece2d0] font-serif">
      <div className="h-[76px] md:h-[88px]" />

      <div className="max-w-5xl mx-auto px-5 md:px-14 py-12 md:py-16 md:bg-[#f7f5f2] md:shadow-[0_0_50px_rgba(58,46,34,0.06)]">

        {/* ── Header ── */}
        <div className="mb-14">
          <p className="text-[11.5px] tracking-[0.3em] text-[#6b5c4a] uppercase mb-3">Legal</p>
          <h1 className="text-[32px] md:text-[42px] text-[#3a2e22] leading-tight mb-4"
            style={{ fontFamily: "var(--font-script), cursive" }}>
            Privacy Policy
          </h1>
          <p className="text-[12.5px] tracking-[0.1em] text-[#6b5c4a] font-serif">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-12">

          {/* ── Sticky sidebar TOC ── */}
          <aside className="hidden md:block w-52 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-[10.5px] tracking-[0.25em] text-[#6b5c4a] uppercase mb-4">Contents</p>
              <nav className="space-y-1">
                {sections.map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-[12px] tracking-[0.06em] text-[#6b5c4a]
                      hover:text-[#3a2e22] transition-colors py-0.5"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0">

            <Section id="overview" title="Overview">
              <P>
                Taylor Vade (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is a luxury fashion brand
                operating at taylorvade.com. We are committed to protecting your personal data and being transparent
                about how we collect and use it.
              </P>
              <P>
                This Privacy Policy explains what information we collect when you visit our website, place an order,
                create an account, or sign up for our newsletter — and how we use, store, and protect that information.
              </P>
              <P>
                We operate in compliance with the Nigerian Data Protection Act 2023 (NDPA), the Nigeria Data
                Protection Regulation (NDPR), and, where applicable to our customers in the United Kingdom and
                European Union, the UK GDPR and EU GDPR respectively.
              </P>
            </Section>

            <Section id="collection" title="Data We Collect">
              <P>We collect the following categories of personal data:</P>

              <div className="space-y-5">
                <div>
                  <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase mb-2">
                    Account &amp; Identity Information
                  </p>
                  <Ul items={[
                    "Full name, email address, and phone number (provided at registration or checkout)",
                    "Password (stored in hashed form — we never see your plain-text password)",
                    "Profile photo (if provided via social login)",
                  ]} />
                </div>

                <div>
                  <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase mb-2">
                    Order &amp; Transactional Data
                  </p>
                  <Ul items={[
                    "Delivery address (street, city, state, country, postal code)",
                    "Order history: items purchased, quantities, prices, and order status",
                    "Payment reference numbers (we do not store card details — these are handled by Paystack)",
                    "Currency and region preference",
                  ]} />
                </div>

                <div>
                  <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase mb-2">
                    Usage &amp; Technical Data
                  </p>
                  <Ul items={[
                    "IP address and approximate location",
                    "Browser type, device type, and operating system",
                    "Pages visited, time spent, and click patterns",
                    "Referral source (how you arrived at our site)",
                    "Cart and wishlist activity",
                  ]} />
                </div>

                <div>
                  <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase mb-2">
                    Communications Data
                  </p>
                  <Ul items={[
                    "Email address and category preferences for our newsletter",
                    "SMS opt-in status (if provided)",
                    "Customer service correspondence",
                  ]} />
                </div>
              </div>
            </Section>

            <Section id="use" title="How We Use Your Data">
              <P>We use your personal data for the following purposes:</P>
              <Ul items={[
                "To process and fulfil your orders, including sending order confirmations and shipping updates",
                "To create and manage your account on our platform",
                "To process payments securely through Paystack",
                "To send you order status updates and transactional emails",
                "To send our newsletter if you have subscribed (you can unsubscribe at any time)",
                "To personalise your shopping experience based on your browsing and purchase history",
                "To detect and prevent fraudulent transactions or abuse of our platform",
                "To improve our website performance, product range, and customer experience",
                "To comply with our legal obligations",
              ]} />
              <P>
                We process your data on the legal bases of: contract performance (to fulfil orders),
                legitimate interests (to improve our services and prevent fraud), consent (for marketing
                communications), and legal obligation (for tax and compliance records).
              </P>
            </Section>

            <Section id="sharing" title="Data Sharing">
              <P>
                We do not sell your personal data to third parties. We share your data only where necessary
                to provide our services:
              </P>

              <div className="space-y-4">
                <div>
                  <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase mb-2">Service Providers</p>
                  <Ul items={[
                    "Supabase (database and authentication infrastructure) — data hosted on servers in the EU",
                    "Paystack — payment processing",
                    "Resend — transactional email delivery (order confirmations, shipping updates)",
                    "Vercel — website hosting and deployment",
                  ]} />
                </div>

                <div>
                  <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase mb-2">Legal Disclosure</p>
                  <P>
                    We may disclose your data if required by law, court order, or to protect the rights, property,
                    or safety of Taylor Vade, our customers, or others.
                  </P>
                </div>

                <div>
                  <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase mb-2">Business Transfers</p>
                  <P>
                    In the event of a merger, acquisition, or sale of assets, your data may be transferred as part
                    of that transaction. You will be notified before any such transfer occurs.
                  </P>
                </div>
              </div>
            </Section>

            <Section id="cookies" title="Cookies">
              <P>
                Our website uses cookies and similar technologies to improve your experience and analyse site usage.
              </P>

              <div className="space-y-4">
                <div>
                  <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase mb-2">Essential Cookies</p>
                  <P>
                    Required for the website to function. These include authentication session cookies (so you stay
                    logged in) and shopping cart session identifiers. You cannot opt out of these.
                  </P>
                </div>

                <div>
                  <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase mb-2">Preference Cookies</p>
                  <P>
                    Store your region and currency preferences so we can display the correct information on your
                    next visit. Stored in your browser&apos;s local storage.
                  </P>
                </div>

                <div>
                  <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase mb-2">Analytics Cookies</p>
                  <P>
                    Help us understand how visitors use our website (pages visited, session duration, etc.)
                    so we can improve the experience. No personally identifiable information is used in analytics.
                  </P>
                </div>
              </div>

              <P>
                You can control or delete cookies at any time through your browser settings.
                Disabling essential cookies will affect your ability to use the website.
              </P>
            </Section>

            <Section id="retention" title="Data Retention">
              <P>We retain your personal data for as long as is necessary for the purposes described in this policy:</P>
              <Ul items={[
                "Account data: retained for as long as your account is active, plus 12 months after closure",
                "Order and transaction records: retained for 7 years to comply with financial and tax regulations",
                "Newsletter subscription data: retained until you unsubscribe, or 2 years of inactivity",
                "Customer service communications: retained for 3 years",
                "Technical logs: retained for 90 days",
              ]} />
              <P>
                When data is no longer required, it is securely deleted or anonymised.
              </P>
            </Section>

            <Section id="rights" title="Your Rights">
              <P>
                Depending on your location, you have the following rights regarding your personal data:
              </P>
              <Ul items={[
                "Right to Access — request a copy of the personal data we hold about you",
                "Right to Rectification — request correction of inaccurate or incomplete data",
                "Right to Erasure — request deletion of your data, subject to legal retention obligations",
                "Right to Restriction — request that we limit processing of your data in certain circumstances",
                "Right to Data Portability — receive your data in a structured, machine-readable format",
                "Right to Object — object to processing based on legitimate interests or for direct marketing",
                "Right to Withdraw Consent — unsubscribe from marketing at any time without penalty",
              ]} />
              <P>
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:contact@taylorvade.com"
                  className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                  contact@taylorvade.com
                </a>
                . We will respond within 30 days. If you are in the EU or UK and believe your rights
                have been violated, you have the right to lodge a complaint with your local data protection authority.
              </P>
            </Section>

            <Section id="security" title="Security">
              <P>
                We implement appropriate technical and organisational security measures to protect your personal data
                against unauthorised access, loss, destruction, or alteration. These include:
              </P>
              <Ul items={[
                "All data transmitted between your browser and our servers is encrypted via TLS (HTTPS)",
                "Passwords are hashed using industry-standard algorithms — they are never stored in plain text",
                "Payment data is processed exclusively by our PCI-DSS compliant payment provider, Paystack — we never store card details",
                "Access to production databases is restricted to authorised personnel only",
                "Row-level security is enforced on our database, ensuring users can only access their own data",
              ]} />
              <P>
                Despite these measures, no method of transmission over the internet is 100% secure. If you believe
                your account has been compromised, contact us immediately at{" "}
                <a href="mailto:contact@taylorvade.com"
                  className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                  contact@taylorvade.com
                </a>.
              </P>
            </Section>

            <Section id="third-parties" title="Third-Party Services">
              <P>
                Our website contains links to third-party sites and integrates with third-party services. This
                Privacy Policy applies only to taylorvade.com. We are not responsible for the privacy practices
                of external websites or services. We encourage you to review their privacy policies before
                providing any personal information.
              </P>
              <P>
                Third-party services we use include Paystack, Supabase, Resend, and Vercel.
                Each operates under its own privacy policy and data processing agreements.
              </P>
            </Section>

            <Section id="children" title="Children's Privacy">
              <P>
                Our services are not directed to individuals under the age of 16. We do not knowingly collect
                personal data from children. If you believe we have inadvertently collected data from a minor,
                please contact us at{" "}
                <a href="mailto:contact@taylorvade.com"
                  className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                  contact@taylorvade.com
                </a>{" "}
                and we will promptly delete it.
              </P>
            </Section>

            <Section id="changes" title="Policy Changes">
              <P>
                We may update this Privacy Policy from time to time to reflect changes in our practices,
                technology, legal requirements, or other factors. When we make material changes, we will:
              </P>
              <Ul items={[
                "Update the &ldquo;Last updated&rdquo; date at the top of this page",
                "Notify registered account holders by email of significant changes",
                "Display a notice on our website where appropriate",
              ]} />
              <P>
                Your continued use of our website after changes are posted constitutes your acceptance of
                the updated policy. We encourage you to review this page periodically.
              </P>
            </Section>

            <Section id="contact" title="Contact Us">
              <P>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our handling
                of your personal data, please contact our Data Protection team:
              </P>

              <div className="bg-white border border-[#e8e2db] p-6 space-y-2">
                <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase font-serif mb-3">
                  Taylor Vade — Data Protection
                </p>
                <p>
                  <span className="text-[#6b5c4a]">Email: </span>
                  <a href="mailto:contact@taylorvade.com"
                    className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                    contact@taylorvade.com
                  </a>
                </p>
                <p>
                  <span className="text-[#6b5c4a]">Website: </span>
                  <a href="https://taylorvade.com"
                    className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                    taylorvade.com
                  </a>
                </p>
                <p className="pt-2 text-[12.5px] text-[#6b5c4a]">
                  We aim to respond to all privacy-related enquiries within 5 business days, and to
                  exercise-of-rights requests within 30 days.
                </p>
              </div>
            </Section>

            {/* ── Footer divider ── */}
            <div className="mt-16 pt-8 border-t border-[#e8e2db]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-[11.5px] tracking-[0.1em] text-[#6b5c4a]">
                  © {new Date().getFullYear()} Taylor Vade. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                  <Link href="/terms"
                    className="text-[11.5px] tracking-[0.1em] text-[#6b5c4a] hover:text-[#3a2e22] transition-colors">
                    Terms &amp; Conditions
                  </Link>
                  <Link href="/cookies"
                    className="text-[11.5px] tracking-[0.1em] text-[#6b5c4a] hover:text-[#3a2e22] transition-colors">
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
