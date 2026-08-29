"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName,  setFullName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [phone,     setPhone]     = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim())         { setError("Please enter your full name."); return; }
    if (password.length < 8)      { setError("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(password))  { setError("Password must include at least one uppercase letter."); return; }
    if (!/[0-9]/.test(password))  { setError("Password must include at least one number."); return; }
    if (password !== confirm)     { setError("Passwords do not match."); return; }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim(), phone: phone.trim() || null },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) {
        if (error.message.includes("already registered")) setError("An account with this email already exists.");
        else setError(error.message);
        return;
      }
      if (data.user && !data.session) { setSuccess(true); return; }
      router.push("/account");
      router.refresh();
    });
  }

  const inputClass = "w-full border border-[#e8e2db] px-4 py-3 text-[13.5px] tracking-wide text-[#1a1008] outline-none focus:border-[#1a1008] transition-colors font-serif placeholder:text-[#c8c0b8] bg-white";

  if (success) {
    return (
      <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center px-4 font-serif">
        <div className="w-full max-w-[400px] text-center">
          <div className="text-center mb-8">
            <Link href="/"><h1 className="text-[38px] text-[#1a1008]" style={{ fontFamily: "var(--font-script), cursive" }}>Taylor Vade</h1></Link>
          </div>
          <div className="bg-white border border-[#e8e2db] p-10">
            <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h2 className="text-[16px] tracking-wide text-[#1a1008] mb-3">Check your email</h2>
            <p className="text-[13.5px] text-[#8a7a6a] leading-relaxed">
              We&apos;ve sent a confirmation link to <strong className="text-[#1a1008]">{email}</strong>. Click it to activate your account.
            </p>
            <Link href="/login" className="block mt-6 text-[12.5px] text-[#8a7a6a] hover:text-[#1a1008] underline underline-offset-2 transition-colors">Back to Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center px-4 py-12 font-serif">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <Link href="/"><h1 className="text-[38px] text-[#1a1008] leading-none" style={{ fontFamily: "var(--font-script), cursive" }}>Taylor Vade</h1></Link>
          <p className="text-[11.5px] tracking-[0.3em] text-[#8a7a6a] uppercase mt-2">Create an account</p>
        </div>

        <div className="bg-white border border-[#e8e2db] p-8">
          {error && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-[13px] text-red-700 tracking-wide">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name" placeholder="Amara Johnson" className={inputClass} />
            </div>
            <div>
              <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="your@email.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Phone <span className="text-[#c8c0b8] normal-case tracking-normal">(optional)</span></label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="+234 800 000 0000" className={inputClass} />
            </div>
            <div>
              <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" placeholder="Min. 8 chars, 1 uppercase, 1 number" className={inputClass} />
            </div>
            <div>
              <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" placeholder="Re-enter your password" className={inputClass} />
            </div>
            <p className="text-[11.5px] text-[#8a7a6a] leading-relaxed tracking-wide pt-1">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="underline hover:text-[#1a1008]">Terms &amp; Conditions</Link>{" "}and{" "}
              <Link href="/privacy" className="underline hover:text-[#1a1008]">Privacy Policy</Link>.
            </p>
            <button type="submit" disabled={isPending} className="w-full bg-[#1a1008] text-white text-[12.5px] tracking-[0.2em] uppercase py-3.5 hover:bg-[#4B3E3C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {isPending ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-[12.5px] tracking-wide text-[#8a7a6a]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#1a1008] underline underline-offset-2 hover:opacity-60 transition-opacity">Sign in</Link>
        </p>
        <p className="text-center mt-4">
          <Link href="/" className="text-[11.5px] tracking-[0.1em] text-[#8a7a6a] hover:text-[#1a1008] transition-colors">← Back to store</Link>
        </p>
      </div>
    </div>
  );
}
