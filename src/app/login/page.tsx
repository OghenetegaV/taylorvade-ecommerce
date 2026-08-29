"use client";
import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("redirect") ?? "/account";
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Invalid login credentials")) setError("Incorrect email or password.");
        else if (error.message.includes("Email not confirmed")) setError("Please confirm your email address first.");
        else setError(error.message);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    });
  }

  async function handleGoogle() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo}` },
    });
  }

  const inputClass = "w-full border border-[#e8e2db] px-4 py-3 text-[13.5px] tracking-wide text-[#1a1008] outline-none focus:border-[#1a1008] transition-colors font-serif placeholder:text-[#c8c0b8] bg-white";

  return (
    <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center px-4 font-serif">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <Link href="/">
            {/* <h1 className="text-[38px] text-[#1a1008] leading-none" style={{ fontFamily: "var(--font-script), cursive" }}>Taylor Vade</h1> */}
          </Link>
          <p className="text-[11.5px] tracking-[0.3em] text-[#8a7a6a] uppercase mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white border border-[#e8e2db] p-8">
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-[13px] text-red-700 tracking-wide">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="your@email.com" className={inputClass} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase">Password</label>
                <Link href="/reset-password" className="text-[11.5px] text-[#8a7a6a] hover:text-[#1a1008] underline underline-offset-2 transition-colors">Forgot password?</Link>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" className={inputClass} />
            </div>
            <button type="submit" disabled={isPending} className="w-full bg-[#1a1008] text-white text-[12.5px] tracking-[0.2em] uppercase py-3.5 hover:bg-[#4B3E3C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e8e2db]" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-[11.5px] tracking-[0.15em] text-[#8a7a6a] uppercase">or</span></div>
          </div>

          <button type="button" onClick={handleGoogle} className="w-full border border-[#e8e2db] bg-white text-[12.5px] tracking-[0.1em] text-[#1a1008] py-3 flex items-center justify-center gap-3 hover:border-[#1a1008] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center mt-6 text-[12.5px] tracking-wide text-[#8a7a6a]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#1a1008] underline underline-offset-2 hover:opacity-60 transition-opacity">Create one</Link>
        </p>
        <p className="text-center mt-4">
          <Link href="/" className="text-[11.5px] tracking-[0.1em] text-[#8a7a6a] hover:text-[#1a1008] transition-colors">← Back to store</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center text-[12.5px] tracking-widest text-[#8a7a6a] font-serif">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
