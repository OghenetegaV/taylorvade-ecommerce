"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

const announcements = [
  "$10 Fixed-Fee U.S. Postal Returns",
  "Free Worldwide Shipping On Orders Over $300",
  "Spring Summer Collection Available Now",
];

export default function AnnouncementBar() {
  return (
    <div className="bg-[#4a3a35] text-white h-[32px] flex items-center z-[100] relative">
      <Swiper
        modules={[Autoplay]}
        slidesPerView={1}
        loop
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
      >
        {announcements.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="text-center text-[10px] tracking-[0.2em] uppercase">
              {item}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}