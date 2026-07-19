"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr"; // Adjust import to your setup

export default function CheckoutPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Initialize anonymous guest session
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function initGuest() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        await supabase.auth.signInAnonymously();
      }
      setLoading(false);
    }
    
    initGuest();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-serif">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#faf9f7] font-serif pt-[100px] md:pt-[120px] px-5 md:px-12">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row gap-12 lg:gap-24">
        
        {/* LEFT: Checkout Forms */}
        <div className="flex-1">
          <h1 className="text-[32px] md:text-[40px] text-[#1a1008] mb-8" style={{ fontFamily: "var(--font-script), cursive" }}>
            Checkout
          </h1>

          <div className="space-y-8">
            <section>
              <h2 className="text-[11px] tracking-[0.2em] uppercase text-[#3a2e22] mb-4">Contact Information</h2>
              <input 
                type="email" 
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-[#3a2e22] py-2 text-[13px] outline-none placeholder:text-[#8a7a6a]"
              />
            </section>

            <section>
              <h2 className="text-[11px] tracking-[0.2em] uppercase text-[#3a2e22] mb-4">Shipping Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="First Name" className="bg-transparent border-b border-[#3a2e22] py-2 text-[13px] outline-none" />
                <input placeholder="Last Name" className="bg-transparent border-b border-[#3a2e22] py-2 text-[13px] outline-none" />
                <input placeholder="Address" className="col-span-2 bg-transparent border-b border-[#3a2e22] py-2 text-[13px] outline-none" />
              </div>
            </section>
          </div>
        </div>

        {/* RIGHT: Order Summary */}
        <div className="md:w-[400px] md:sticky md:top-[120px] self-start">
          <div className="bg-[#f0eeeb] p-8">
            <h2 className="text-[11px] tracking-[0.2em] uppercase text-[#3a2e22] mb-6">Order Summary</h2>
            
            <div className="border-t border-[#d5cec4] pt-6 space-y-3">
              <div className="flex justify-between text-[12px] text-[#5a4a3a]">
                <span>Shipping</span>
                <span>Calculated at next step</span>
              </div>
              <div className="flex justify-between text-[14px] font-semibold pt-4 border-t border-[#d5cec4]">
                <span>Total</span>
                <span>£0.00</span>
              </div>
            </div>

            <button className="w-full bg-[#3a2e22] text-white py-4 mt-8 text-[11px] tracking-[0.2em] uppercase hover:bg-[#1a1008] transition-colors">
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}