"use client";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-[10.5px] tracking-[0.1em] text-[#8a7a6a] border border-[#e8e2db]
        px-4 py-2 hover:border-[#1a1008] hover:text-[#1a1008] transition-colors font-serif"
    >
      Sign Out
    </button>
  );
}
