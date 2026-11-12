import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const pastor = await db.user.findUnique({
    where: { id: BigInt(id), role: "PASTOR" },
    select: { isActive: true },
  });

  if (!pastor) {
    return NextResponse.json({ error: "Pasteur introuvable" }, { status: 404 });
  }

  const updated = await db.user.update({
    where: { id: BigInt(id) },
    data: { isActive: !pastor.isActive },
    select: { id: true, isActive: true },
  });

  return NextResponse.json(updated);
}
