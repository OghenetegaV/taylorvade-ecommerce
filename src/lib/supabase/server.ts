// src/lib/supabase/server.ts
// Server-side Supabase clients — used in Server Components and API routes

import { createServerClient } from "@supabase/ssr";
import { createClient }       from "@supabase/supabase-js";
import { cookies }            from "next/headers";

// ── Standard client — respects RLS, reads session from cookies ──────────────
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}

// ── Admin client — fully bypasses RLS ───────────────────────────────────────
// Uses createClient from @supabase/supabase-js (NOT createServerClient).
// createServerClient evaluates RLS even with the service role key.
// createClient with the service role key is what actually bypasses it.
// NOT async — no cookies needed. Call it directly: createSupabaseAdminClient()
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  );
}

// ── Helper — get the currently authenticated user from a server context ──────
export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}