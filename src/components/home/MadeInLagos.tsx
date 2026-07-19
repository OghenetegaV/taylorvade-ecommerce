"use client";

import Link from "next/link";

export default function MadeInLagos() {
  return (
    <section className="bg-[#fafafa]">
      <div className="flex flex-col md:flex-row items-center md:h-screen w-full overflow-hidden">
        
        {/* Film Container (Left on desktop) */}
        <div className="md:w-[56%] w-full order-1 md:h-full flex items-center justify-center p-4 md:p-8">
          <video
            className="w-full h-auto max-h-full object-contain block rounded-md"
            src="/videos/process.mp4"
            poster="/videos/process-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>

        {/* Copy (Right on desktop) */}
        <div className="md:w-[44%] w-full flex flex-col justify-center px-5 md:px-[4vw] py-14 md:py-0 order-2">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase font-serif text-[#8f8f8a] mb-4">
              The Process
            </p>
            <h2 className="text-[#111] leading-[1.05]"
              style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(32px,4.5vw,54px)" }}>
              Made in Lagos.
              <br />
              Worn everywhere.
            </h2>
            <p className="text-[#555] text-[12.5px] md:text-[13.5px] font-serif leading-[1.9]
              tracking-[0.03em] mt-6 max-w-[420px]">
              Every piece starts as cloth on a cutting table in Lagos — measured twice,
              cut once, finished by hand. No mass runs. No shortcuts. When a jacket
              leaves our studio, it carries the hours that went into it.
            </p>
            <Link href="/about"
              className="inline-block mt-8 text-[10.5px] tracking-[0.2em] uppercase font-serif
                text-[#111] border-b border-[#111]/40 pb-1
                hover:border-[#111] transition-colors">
              Our story
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}