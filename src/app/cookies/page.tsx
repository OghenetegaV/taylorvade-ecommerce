// src/app/cookies/page.tsx

import Link from "next/link";

export const metadata = {
  title: "Cookie Policy — Taylor Vade",
  description: "The cookies and browser storage Taylor Vade uses, and why.",
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

const COOKIES = [
  { name: "sb-*-auth-token", purpose: "Keeps you signed in (Supabase authentication)", duration: "Session / persistent", type: "Essential" },
  { name: "tv_session",      purpose: "Identifies your shopping bag before you sign in or check out as a guest", duration: "30 days", type: "Essential" },
];

const LOCAL_STORAGE = [
  { name: "tv_currency", purpose: "Remembers your selected display currency" },
  { name: "tv_country",  purpose: "Remembers your selected region" },
];

export default function CookiePolicyPage() {
  const sections = [
    { id: "what",       label: "What Cookies Are" },
    { id: "essential",  label: "Essential Cookies" },
    { id: "storage",    label: "Local Storage" },
    { id: "analytics",  label: "Analytics" },
    { id: "control",    label: "Managing Cookies" },
    { id: "contact",    label: "Contact Us" },
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
            Cookie Policy
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 md:px-10 py-12 md:py-16">
        <div className="mb-14">
          <p className="text-[11.5px] tracking-[0.3em] text-[#9a8a7a] uppercase mb-3">Legal</p>
          <h1 className="text-[32px] md:text-[42px] text-[#3a2e22] leading-tight mb-4"
            style={{ fontFamily: "var(--font-script), cursive" }}>
            Cookie Policy
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
            <Section id="what" title="What Cookies Are">
              <P>
                Cookies are small text files stored on your device when you visit a website. We also use browser
                local storage, which works similarly but is only ever read by taylorvade.com. This page lists
                exactly what we use and why — see our{" "}
                <Link href="/privacy" className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                  Privacy Policy
                </Link>{" "}
                for how we handle personal data more broadly.
              </P>
            </Section>

            <Section id="essential" title="Essential Cookies">
              <P>
                These are required for the Site to function — for example, keeping you signed in and remembering
                your shopping bag if you haven&apos;t created an account. You can&apos;t opt out of these while
                using the Site.
              </P>
              <div className="overflow-x-auto">
                <table className="w-full text-[13.5px] border-collapse mt-2">
                  <thead>
                    <tr className="border-b border-[#e8e2db]">
                      <th className="text-left py-2 pr-3 text-[#8a7a6a] uppercase tracking-[0.06em] text-[12px]">Name</th>
                      <th className="text-left py-2 pr-3 text-[#8a7a6a] uppercase tracking-[0.06em] text-[12px]">Purpose</th>
                      <th className="text-left py-2 text-[#8a7a6a] uppercase tracking-[0.06em] text-[12px]">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COOKIES.map(c => (
                      <tr key={c.name} className="border-b border-[#e8e2db]">
                        <td className="py-2.5 pr-3 text-[#3a2e22] font-mono text-[12.5px]">{c.name}</td>
                        <td className="py-2.5 pr-3">{c.purpose}</td>
                        <td className="py-2.5">{c.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="storage" title="Local Storage">
              <P>
                We use your browser&apos;s local storage (not a cookie sent to our servers) to remember a couple
                of display preferences:
              </P>
              <div className="overflow-x-auto">
                <table className="w-full text-[13.5px] border-collapse mt-2">
                  <thead>
                    <tr className="border-b border-[#e8e2db]">
                      <th className="text-left py-2 pr-3 text-[#8a7a6a] uppercase tracking-[0.06em] text-[12px]">Key</th>
                      <th className="text-left py-2 text-[#8a7a6a] uppercase tracking-[0.06em] text-[12px]">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LOCAL_STORAGE.map(c => (
                      <tr key={c.name} className="border-b border-[#e8e2db]">
                        <td className="py-2.5 pr-3 text-[#3a2e22] font-mono text-[12.5px]">{c.name}</td>
                        <td className="py-2.5">{c.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <P>
                Your selected display currency affects prices shown while browsing only — the amount you&apos;re
                actually charged at checkout is always in Nigerian Naira (₦).
              </P>
            </Section>

            <Section id="analytics" title="Analytics">
              <P>
                We use Google Analytics (GA4) to understand how visitors use the Site — pages viewed, products
                browsed, and purchase events — so we can improve it. Google may set its own cookies as part of
                this; see Google&apos;s own privacy policy for details on how it handles that data.
              </P>
            </Section>

            <Section id="control" title="Managing Cookies">
              <P>
                Most browsers let you block or delete cookies through their settings. Blocking essential cookies
                will prevent core features — like staying signed in or keeping items in your bag — from working
                correctly. You can also clear local storage for this Site at any time from your browser&apos;s
                site-data settings, which will reset your saved currency/region preference.
              </P>
            </Section>

            <Section id="contact" title="Contact Us">
              <div className="bg-white border border-[#e8e2db] p-6 space-y-2">
                <p className="text-[12px] tracking-[0.15em] text-[#3a2e22] uppercase font-serif mb-3">
                  Taylor Vade
                </p>
                <p>
                  <span className="text-[#9a8a7a]">Email: </span>
                  <a href="mailto:privacy@taylorvade.com" className="text-[#3a2e22] underline underline-offset-2 hover:opacity-60 transition-opacity">
                    privacy@taylorvade.com
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
                  <Link href="/privacy" className="text-[11.5px] tracking-[0.1em] text-[#9a8a7a] hover:text-[#3a2e22] transition-colors">
                    Privacy Policy
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
