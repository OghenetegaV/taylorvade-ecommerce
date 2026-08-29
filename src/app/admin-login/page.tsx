// src/app/admin-login/page.tsx
// Dedicated admin sign-in — styled to match the admin console (slate/blue),
// separate from the store's serif login page.

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Sparkles, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, LogOut, ArrowRight,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [existing,   setExisting]   = useState<string | null>(null); // already-signed-in email

  // If someone is already signed in but got bounced here, they're not an admin.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setExisting(session.user.email);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setExisting(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setBusy(false);
      setError(
        authError.message === "Invalid login credentials"
          ? "Invalid email or password."
          : authError.message
      );
      return;
    }

    // Let the server-side admin layout verify the ADMIN role.
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans
      relative overflow-hidden">

      {/* Ambient gradient orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-600/20 blur-[120px]" />

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600
            flex items-center justify-center shadow-lg shadow-blue-500/40 mb-4">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-white text-lg font-bold">Taylor Vade</h1>
          <p className="text-slate-400 text-xs tracking-wide mt-0.5">Admin Console</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">

          {existing ? (
            /* Signed in but not authorized */
            <div className="text-center py-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">Not an admin account</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                You&apos;re signed in as <span className="text-slate-200 font-medium">{existing}</span>,
                but this account doesn&apos;t have admin access.
              </p>
              <button
                onClick={handleSignOut}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15
                  text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out &amp; use another account
              </button>
              <Link href="/"
                className="block mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                ← Back to store
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-white text-base font-bold mb-1">Welcome back</h2>
              <p className="text-slate-400 text-xs mb-6">Sign in to manage the store.</p>

              {error && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30
                  rounded-xl px-3.5 py-2.5 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-400 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email" required autoFocus value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@taylorvade.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                        text-sm text-white placeholder:text-slate-600 outline-none
                        focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPass ? "text" : "password"} required value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 bg-white/5 border border-white/10 rounded-xl
                        text-sm text-white placeholder:text-slate-600 outline-none
                        focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      aria-label={showPass ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={busy}
                  className="w-full flex items-center justify-center gap-2
                    bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700
                    text-white text-sm font-semibold py-3 rounded-xl transition-all
                    shadow-lg shadow-blue-500/30 disabled:opacity-60"
                >
                  {busy
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                    : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/8">
                <Link href="/reset-password"
                  className="text-[12.5px] text-slate-500 hover:text-slate-300 transition-colors">
                  Forgot password?
                </Link>
                <Link href="/"
                  className="text-[12.5px] text-slate-500 hover:text-slate-300 transition-colors">
                  ← Back to store
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[11.5px] text-slate-600 mt-6">
          Authorised personnel only. Access is logged.
        </p>
      </div>
    </div>
  );
}
