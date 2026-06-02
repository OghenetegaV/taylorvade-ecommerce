// src/lib/admin.ts

import { getServerUser } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function requireAdmin(): Promise<
  { profile: { id: string; email: string; fullName: string | null } } | NextResponse
> {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, fullName: true, role: true },
  });

  if (!profile || profile.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 }
    );
  }

  return { profile };
}