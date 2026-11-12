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
  const church = await db.church.findUnique({
    where: { id: BigInt(id) },
    select: { isActive: true },
  });

  if (!church) {
    return NextResponse.json({ error: "Église introuvable" }, { status: 404 });
  }

  const updated = await db.church.update({
    where: { id: BigInt(id) },
    data: { isActive: !church.isActive },
  });

  return NextResponse.json(updated);
}
