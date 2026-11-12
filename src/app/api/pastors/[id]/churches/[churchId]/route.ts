import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const PatchSchema = z.object({
  isPrimary: z.boolean(),
});

type Params = { params: Promise<{ id: string; churchId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id, churchId: churchIdStr } = await params;
  const pastorId = BigInt(id);
  const churchId = BigInt(churchIdStr);

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { isPrimary } = parsed.data;

  const assignment = await db.pastorChurch.findUnique({
    where: { pastorId_churchId: { pastorId, churchId } },
  });

  if (!assignment || !assignment.isActive) {
    return NextResponse.json({ error: "Affectation introuvable" }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.pastorChurch.updateMany({
        where: { churchId, isPrimary: true, isActive: true },
        data: { isPrimary: false },
      });
    }
    await tx.pastorChurch.update({
      where: { pastorId_churchId: { pastorId, churchId } },
      data: { isPrimary },
    });
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id, churchId: churchIdStr } = await params;
  const pastorId = BigInt(id);
  const churchId = BigInt(churchIdStr);

  const assignment = await db.pastorChurch.findUnique({
    where: { pastorId_churchId: { pastorId, churchId } },
  });

  if (!assignment || !assignment.isActive) {
    return NextResponse.json({ error: "Affectation introuvable" }, { status: 404 });
  }

  await db.pastorChurch.update({
    where: { pastorId_churchId: { pastorId, churchId } },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
