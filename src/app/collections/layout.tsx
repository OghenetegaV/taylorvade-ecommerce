// src/app/collections/[slug]/layout.tsx
// Wraps collection pages with a sticky white header

import Header from "@/components/layout/Header";

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* White header for interior pages */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#e8e2db]"
           style={{ marginTop: 0 }}>
        <Header />
      </div>
      {children}
    </>
  );
}