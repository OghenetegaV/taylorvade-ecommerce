// src/proxy.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPreLaunch } from "@/lib/launch";

const PROTECTED_ROUTES = ["/account", "/orders"];
const AUTH_ROUTES      = ["/login", "/register"];
const ADMIN_ROUTES     = ["/admin"];

// ── Pre-launch privacy (see src/lib/launch.ts) ──────────────────────────────
// Until launch, store pages redirect to /launch. These stay reachable so the
// team can keep working: admin + sign-in, legal pages, and the API.
const LAUNCH_PATH = "/launch";
const PRELAUNCH_ALLOWED = [
  LAUNCH_PATH,
  "/api",
  "/admin",
  "/admin-login",
  "/login",
  "/reset-password",
  "/update-password",
  "/privacy",
  "/terms",
  "/cookies",
];
// Private preview of the real store before launch: visit any page with
// ?preview=<LAUNCH_PREVIEW_KEY> once; a cookie then lets that browser through.
const PREVIEW_COOKIE = "tv_preview";
const PREVIEW_KEY    = process.env.LAUNCH_PREVIEW_KEY;

function launchGate(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;

  if (!isPreLaunch()) {
    // Launched: the holding page is retired.
    return pathname === LAUNCH_PATH ? NextResponse.redirect(new URL("/", request.url)) : null;
  }

  const allowed = PRELAUNCH_ALLOWED.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  // Files with an extension (robots.txt, videos, fonts…) pass through.
  if (allowed || /\.[a-z0-9]+$/i.test(pathname)) return null;

  if (PREVIEW_KEY) {
    if (searchParams.get("preview") === PREVIEW_KEY) {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete("preview");
      const res = NextResponse.redirect(clean);
      res.cookies.set(PREVIEW_COOKIE, PREVIEW_KEY, {
        httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }
    if (request.cookies.get(PREVIEW_COOKIE)?.value === PREVIEW_KEY) return null;
  }

  return NextResponse.redirect(new URL(LAUNCH_PATH, request.url), 307);
}

export async function proxy(request: NextRequest) {  // ← renamed from middleware
  const gated = launchGate(request);
  if (gated) return gated;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  if (isAdminRoute && !user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected && !user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};