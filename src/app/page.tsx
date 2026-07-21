// src/app/page.tsx
// Homepage — editorial build, full order:
// Hero → Campaign Film → Ticker → New In → Type Wall → Lookbook
// → Made in Lagos → The Vaders → Exit Doors → Newsletter band
// (Footer + popup come from ConditionalFooter in layout.tsx)

import Header             from "@/components/layout/Header";
import HeroSection        from "@/components/home/HeroSection";
import CampaignFilm       from "@/components/home/CampaignFilm";
import BrandTicker        from "@/components/home/BrandTicker";
import NewInRail          from "@/components/home/NewInRail";
import TypeWall           from "@/components/home/TypeWall";
import HorizontalLookbook from "@/components/home/HorizontalLookbook";
import MadeInLagos        from "@/components/home/MadeInLagos";
import VadersStrip        from "@/components/home/VadersStrip";
import ExitDoors          from "@/components/home/ExitDoors";
import NewsletterBand     from "@/components/home/NewsletterBand";
import FullscreenVideo from "@/components/home/FullscreenVideo";

export default function Home() {
  return (
    <main>
      <Header />
      <HeroSection />
      <BrandTicker />      
      {/* <TypeWall /> */}
      {/* <HorizontalLookbook /> */}
      {/* <NewInRail />       */}
      {/* <CampaignFilm /> */}
      {/* <MadeInLagos /> */}
      {/* <VadersStrip /> */}
      {/* <NewsletterBand /> */}
      {/* <ExitDoors /> */}
      {/* // <FullscreenVideo /> */}
    </main>
  );
}
