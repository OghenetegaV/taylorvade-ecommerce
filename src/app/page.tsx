import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import HeroSection from "@/components/home/HeroSection";

export default function HomePage() {
  return (
    <main className="bg-[#f7f2eb] overflow-hidden">
      {/* <AnnouncementBar /> */}
      <Header />
      <HeroSection />
    </main>
  );
}