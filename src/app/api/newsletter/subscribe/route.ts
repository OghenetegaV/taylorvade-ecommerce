// src/app/api/newsletter/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, categories, smsOptIn } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please select at least one category." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseAdminClient();

    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          email:      email.toLowerCase().trim(),
          categories: categories,
          sms_opt_in: smsOptIn ?? false,
          source:     "website",
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error("[Newsletter] Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "You're on the list.",
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
