"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent,  setSent]  = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) { setError(error.message); return; }
      setSent(true);
    });
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center px-4 font-serif">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-10">
          <Link href="/"><h1 className="text-[38px] text-[#1a1008]" style={{ fontFamily: "var(--font-script), cursive" }}>Taylor Vade</h1></Link>
          <p className="text-[10px] tracking-[0.3em] text-[#8a7a6a] uppercase mt-2">Reset Password</p>
        </div>
        <div className="bg-white border border-[#e8e2db] p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <p className="text-[13px] text-[#1a1008] mb-2">Email sent</p>
              <p className="text-[11.5px] text-[#8a7a6a] leading-relaxed">
                A reset link has been sent to <strong className="text-[#1a1008]">{email}</strong>.
              </p>
              <Link href="/login" className="inline-block mt-6 text-[11px] text-[#8a7a6a] hover:text-[#1a1008] underline underline-offset-2 transition-colors">Back to Sign In</Link>
            </div>
          ) : (
            <>
              <p className="text-[12px] text-[#8a7a6a] leading-relaxed tracking-wide mb-5">
                Enter the email address on your account and we&apos;ll send you a reset link.
              </p>
              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-[11.5px] text-red-700">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com"
                    className="w-full border border-[#e8e2db] px-4 py-3 text-[12px] text-[#1a1008] outline-none focus:border-[#1a1008] transition-colors font-serif placeholder:text-[#c8c0b8] bg-white" />
                </div>
                <button type="submit" disabled={isPending}
                  className="w-full bg-[#1a1008] text-white text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-[#3a2e22] transition-colors disabled:opacity-50">
                  {isPending ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
              <p className="text-center mt-4 text-[10.5px]">
                <Link href="/login" className="text-[#8a7a6a] hover:text-[#1a1008] underline underline-offset-2 transition-colors">Back to Sign In</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
