"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8)     { setError("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(password)) { setError("Must include at least one uppercase letter."); return; }
    if (!/[0-9]/.test(password)) { setError("Must include at least one number."); return; }
    if (password !== confirm)    { setError("Passwords do not match."); return; }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(error.message); return; }
      router.push("/account");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center px-4 font-serif">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-10">
          <Link href="/"><h1 className="text-[38px] text-[#1a1008]" style={{ fontFamily: "var(--font-script), cursive" }}>Taylor Vade</h1></Link>
          <p className="text-[11.5px] tracking-[0.3em] text-[#8a7a6a] uppercase mt-2">Set New Password</p>
        </div>
        <div className="bg-white border border-[#e8e2db] p-8">
          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-[13px] text-red-700">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">New Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password"
                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                className="w-full border border-[#e8e2db] px-4 py-3 text-[13.5px] text-[#1a1008] outline-none focus:border-[#1a1008] transition-colors font-serif placeholder:text-[#c8c0b8] bg-white" />
            </div>
            <div>
              <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password"
                placeholder="Re-enter new password"
                className="w-full border border-[#e8e2db] px-4 py-3 text-[13.5px] text-[#1a1008] outline-none focus:border-[#1a1008] transition-colors font-serif placeholder:text-[#c8c0b8] bg-white" />
            </div>
            <button type="submit" disabled={isPending}
              className="w-full bg-[#1a1008] text-white text-[12.5px] tracking-[0.2em] uppercase py-3.5 hover:bg-[#4B3E3C] transition-colors disabled:opacity-50">
              {isPending ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
