// src/app/admin/layout.tsx

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import AdminShell from "./AdminShell";

async function getAdminProfile() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { fullName: true, email: true, role: true },
  });
  return profile?.role === "ADMIN" ? profile : null;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getAdminProfile();
  if (!profile) redirect("/login?redirect=/admin");
  return <AdminShell profile={profile}>{children}</AdminShell>;
}
