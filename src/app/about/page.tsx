// src/app/about/page.tsx
// Brand story page — content supplied by the client ("ABOUT TAYLOR VADE" doc).

export const metadata = {
  title: "About — Taylor Vade",
  description: "Designed for the discerning. The story, purpose, and philosophy behind Taylor Vade.",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11.5px] tracking-[0.3em] text-[#9a8a7a] uppercase mb-3">{children}</p>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[30px] md:text-[38px] text-[#1a1008] leading-tight mb-6"
      style={{ fontFamily: "var(--font-script), serif" }}>
      {children}
    </h2>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 text-[14.5px] leading-[1.9] tracking-[0.02em] text-[#5a4a3a] font-serif max-w-[620px]">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-16 md:my-20 h-px bg-[#e8e2db]" />;
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#faf9f7] font-serif">
      <div className="h-[76px] md:h-[88px]" />

      {/* ── Hero ── */}
      <div className="max-w-3xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-4 text-center">
        <Eyebrow>About Taylor Vade</Eyebrow>
        <h1 className="text-[42px] md:text-[58px] text-[#1a1008] leading-[1.05]"
          style={{ fontFamily: "var(--font-script), serif" }}>
          Designed for the Discerning.
        </h1>
      </div>

      <div className="max-w-3xl mx-auto px-5 md:px-8 pt-10 pb-24 md:pb-32">

        <div className="space-y-5 text-[15.5px] leading-[1.9] tracking-[0.02em] text-[#3a2e22] font-serif text-center max-w-[640px] mx-auto">
          <p>
            Taylor Vade is a contemporary fashion house creating premium essentials for individuals
            who understand that true style is defined by intention, not excess.
          </p>
          <p>
            We believe the most powerful wardrobes are built on timeless pieces — garments that
            transcend trends, elevate everyday living, and inspire quiet confidence.
          </p>
          <p>
            Every collection is thoughtfully designed to balance refined aesthetics, exceptional
            craftsmanship, and everyday functionality, allowing our customers to invest in clothing
            that remains relevant for years, not seasons.
          </p>
          <p>
            Taylor Vade exists for those who appreciate quality over quantity, substance over
            spectacle, and confidence over conformity.
          </p>
        </div>

        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-16">
          <div>
            <Heading>Our Purpose</Heading>
            <Body>
              <p>To create timeless essentials that empower people to dress with quiet confidence every day.</p>
              <p>
                Everything we design begins with this purpose. From the first sketch to the final
                stitch, our goal is to create clothing that feels effortless, looks refined, and
                becomes an essential part of modern life.
              </p>
            </Body>
          </div>
          <div>
            <Heading>Our Vision</Heading>
            <Body>
              <p>
                To become Africa&rsquo;s leading premium essentials brand with global relevance,
                redefining contemporary fashion through timeless design, exceptional craftsmanship,
                and uncompromising quality.
              </p>
              <p>
                We envision Taylor Vade as a globally respected fashion house that represents
                African excellence while serving discerning customers around the world.
              </p>
            </Body>
          </div>
        </div>

        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-16">
          <div>
            <Heading>Our Mission</Heading>
            <Body>
              <p>
                We create thoughtfully designed wardrobe essentials that combine timeless
                aesthetics, premium craftsmanship, and everyday functionality.
              </p>
              <p>
                Our commitment is to deliver garments that offer lasting value — not only through
                quality construction but through designs that remain relevant beyond changing trends.
              </p>
            </Body>
          </div>
          <div>
            <Heading>Craftsmanship</Heading>
            <Body>
              <p>Exceptional garments are created through exceptional processes.</p>
              <p>
                We carefully select premium fabrics and materials that offer durability, comfort,
                and refinement. From stitching and finishing to trims and construction, every
                decision reflects our commitment to quality.
              </p>
              <p>We believe luxury is experienced through the details that cannot always be seen — but are always felt.</p>
            </Body>
          </div>
        </div>

        <Divider />

        {/* ── Philosophy pull-quote ── */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[22px] md:text-[28px] text-[#1a1008] leading-snug"
            style={{ fontFamily: "var(--font-script), serif" }}>
            Fashion is temporary. Character is enduring.
          </p>
          <div className="mt-6 space-y-4 text-[14.5px] leading-[1.9] tracking-[0.02em] text-[#5a4a3a] max-w-[560px] mx-auto">
            <p>The clothes we choose should reflect who we are rather than the trends of the moment.</p>
            <p>
              At Taylor Vade, we design garments that allow the individual to stand out through
              refinement rather than excess. Every piece is intentionally minimal, carefully
              balanced, and built with longevity in mind.
            </p>
            <p>We believe simplicity requires discipline, and timelessness requires purpose.</p>
          </div>
        </div>

        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-14 md:gap-16">
          <div>
            <Heading>Our Design Philosophy</Heading>
            <Body>
              <p>Every Taylor Vade collection begins with intention.</p>
              <p>
                Our design process combines creativity, technical precision, and a deep
                understanding of how modern people live, work, and move. Every garment is
                developed through careful consideration of:
              </p>
            </Body>
          </div>
          <ul className="space-y-2.5 self-center">
            {["Silhouette", "Fit and proportion", "Fabric performance", "Construction quality", "Comfort", "Versatility", "Longevity"].map(item => (
              <li key={item} className="flex items-center gap-3 text-[14px] tracking-[0.05em] text-[#3a2e22]">
                <span className="w-1 h-1 rounded-full bg-[#8B5E3C] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-8 text-[14.5px] leading-[1.9] tracking-[0.02em] text-[#5a4a3a] max-w-[620px]">
          Every detail serves a purpose. Nothing exists merely for decoration.
        </p>

        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-16">
          <div>
            <Heading>Vaders</Heading>
            <Body>
              <p>
                Taylor Vade is created for discerning individuals who value thoughtful design,
                quiet confidence, and lasting quality.
              </p>
              <p>
                They are professionals, entrepreneurs, creatives, and leaders who appreciate
                clothing that complements their lifestyle rather than defines it.
              </p>
              <p>
                They understand that confidence comes from being well-prepared, well-presented,
                and authentic. They buy with intention and wear with purpose.
              </p>
            </Body>
          </div>
          <div>
            <Heading>Our Product Philosophy</Heading>
            <Body>
              <p>We do not create wardrobes for a season. We create essentials for a lifetime.</p>
              <p>
                Our collections are designed to work together, allowing customers to build
                versatile wardrobes that remain relevant across occasions and years.
              </p>
              <p>
                From elevated everyday essentials to refined tailoring and contemporary outerwear,
                every Taylor Vade piece shares the same commitment to timeless design and
                uncompromising quality. As the brand evolves, our product offering will continue
                to expand while remaining rooted in this philosophy.
              </p>
            </Body>
          </div>
        </div>

        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-16">
          <div>
            <Heading>Our Promise</Heading>
            <Body>
              <p>Every Taylor Vade garment is created with one commitment:</p>
              <p>
                To deliver timeless essentials that combine premium craftsmanship, exceptional
                comfort, and enduring style.
              </p>
              <p>
                We measure success not by how quickly our collections change, but by how often
                our customers return to the pieces they already own.
              </p>
            </Body>
          </div>
          <div>
            <Heading>Looking Ahead</Heading>
            <Body>
              <p>Taylor Vade is building more than a fashion label.</p>
              <p>We are building a modern African brand that speaks confidently on the global stage.</p>
              <p>
                As we expand into womenswear, new product categories, and international markets,
                our purpose remains unchanged: to create timeless essentials that empower people
                to dress with quiet confidence every day.
              </p>
            </Body>
          </div>
        </div>

        <Divider />

        {/* ── Founder's letter ── */}
        <div className="max-w-[640px] mx-auto text-center">
          <Eyebrow>A Letter From The Founder</Eyebrow>
          <div className="mt-6 space-y-4 text-[15px] leading-[1.9] tracking-[0.02em] text-[#5a4a3a] text-left">
            <p>
              Taylor Vade was born from a simple belief: that the finest clothing doesn&rsquo;t need
              to shout to make an impression.
            </p>
            <p>
              In a world driven by fast fashion and fleeting trends, we chose a different path —
              one rooted in timeless design, meticulous craftsmanship, and intentional simplicity.
            </p>
            <p>
              Every garment we create reflects our conviction that clothing should serve the
              individual, not compete for attention. We design with purpose, build with care, and
              strive to create pieces that earn a permanent place in our customers&rsquo; wardrobes.
            </p>
            <p>
              Our ambition extends beyond making exceptional clothing. We are committed to building
              a globally respected African fashion house that demonstrates what thoughtful design,
              uncompromising quality, and consistent excellence can achieve.
            </p>
            <p>
              This is only the beginning of the Taylor Vade journey, and we are grateful to have
              you walk it with us.
            </p>
          </div>
          <div className="mt-10">
            <p className="text-[26px] text-[#1a1008]" style={{ fontFamily: "var(--font-script), serif" }}>
              Victor Adeyanju
            </p>
            <p className="text-[12px] tracking-[0.15em] text-[#9a8a7a] uppercase mt-1">
              Founder &amp; Creative Director
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
