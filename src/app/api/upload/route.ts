// src/app/api/upload/route.ts
// POST /api/upload — upload product image to Supabase Storage

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE_MB   = 5;

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file     = formData.get("file") as File | null;
    const folder   = (formData.get("folder") as string) ?? "products";

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Only JPEG, PNG, WebP and AVIF are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `File must be under ${MAX_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseAdminClient();

    // ── Generate unique file path ─────────────────────────────────────
    const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const buffer   = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("product-images")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("[Upload] Supabase error:", error.message);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Upload failed" },
        { status: 500 }
      );
    }

    // ── Get public URL ────────────────────────────────────────────────
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filename);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { url: publicUrl, filename },
    });
  } catch (error) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}