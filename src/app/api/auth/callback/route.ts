// src/app/api/auth/callback/route.ts
// Handles Supabase OAuth and magic-link redirects
// Also creates the Profile record in our DB on first sign-in

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[Auth Callback] Error:", error?.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = data.user;

  // Upsert profile — creates on first sign-in, no-op thereafter
  try {
    await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        email: user.email!,
        // Update name/avatar if available from OAuth provider
        fullName:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          undefined,
        avatarUrl: user.user_metadata?.avatar_url ?? undefined,
      },
      create: {
        id: user.id,
        email: user.email!,
        fullName:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
    });
  } catch (dbError) {
    console.error("[Auth Callback] Profile upsert failed:", dbError);
    // Don't block sign-in for a DB error — user is still authenticated
  }

  return NextResponse.redirect(`${origin}${next}`);
}