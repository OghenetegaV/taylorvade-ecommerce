"use client";

import Link from "next/link";

export default function LagosInMotion() {
  return (
    <section className="bg-[#fafafa]">
      <div className="flex flex-col md:flex-row items-center md:h-screen w-full overflow-hidden">
        
        {/* Copy (Left on desktop) */}
        <div className="md:w-[44%] w-full flex flex-col justify-center px-5 md:px-[4vw] py-14 md:py-0 order-2 md:order-1">
          <div>
            <p className="text-[11.5px] tracking-[0.3em] uppercase font-serif text-[#8f8f8a] mb-4">
              The Film — Chapter Two
            </p>
            <h2 className="text-[#111] leading-[1.05]"
              style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(32px,4.5vw,54px)" }}>
              Lagos, in motion
            </h2>
            <p className="text-[#555] text-[14px] md:text-[15px] font-serif leading-[1.9]
              tracking-[0.03em] mt-6 max-w-[420px]">
              The collection in motion — how each piece moves, falls, and holds its shape 
              when worn against the rhythmic backdrop of the city. Worn by the discerning, 
              designed for natural posture.
            </p>
            <Link href="/about"
              className="inline-block mt-8 text-[12px] tracking-[0.2em] uppercase font-serif
                text-[#111] border-b border-[#111]/40 pb-1
                hover:border-[#111] transition-colors">
              Our story
            </Link>
          </div>
        </div>

        {/* Film Container (Right on desktop) */}
        <div className="md:w-[56%] w-full order-1 md:order-2 md:h-full flex items-center justify-center p-4 md:p-8">
          <video
            className="w-full h-auto max-h-full object-contain block rounded-md"
            src="/videos/campaign.mp4"
            poster="/videos/campaign-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>

      </div>
    </section>
  );
}