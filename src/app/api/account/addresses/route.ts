import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  const addresses = await prisma.address.findMany({
    where: { profileId: user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  return NextResponse.json({ success: true, data: addresses });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });

  const { fullName, phone, addressLine1, addressLine2, city, state, country, postalCode, isDefault } = await req.json();
  if (!fullName || !phone || !addressLine1 || !city || !state) {
    return NextResponse.json({ success: false, error: "Required fields missing" }, { status: 400 });
  }

  if (isDefault) {
    await prisma.address.updateMany({ where: { profileId: user.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: {
      profileId: user.id, fullName, phone, addressLine1,
      addressLine2: addressLine2 || null, city, state,
      country: country || "Nigeria", postalCode: postalCode || null,
      isDefault: isDefault ?? false,
    },
  });

  return NextResponse.json({ success: true, data: address });
}

export async function DELETE(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

  const address = await prisma.address.findFirst({ where: { id, profileId: user.id } });
  if (!address) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
