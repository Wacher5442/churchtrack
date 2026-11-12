import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const AssignSchema = z.object({
  churchId: z.string().min(1, "L'église est requise"),
  isPrimary: z.boolean().default(false),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const pastorId = BigInt(id);

  const pastor = await db.user.findUnique({ where: { id: pastorId, role: "PASTOR" } });
  if (!pastor) {
    return NextResponse.json({ error: "Pasteur introuvable" }, { status: 404 });
  }

  const assignments = await db.pastorChurch.findMany({
    where: { pastorId, isActive: true },
    include: {
      church: { select: { id: true, name: true, location: true, isActive: true } },
    },
    orderBy: [{ isPrimary: "desc" }, { church: { name: "asc" } }],
  });

  return NextResponse.json(
    assignments.map((a) => ({
      churchId: a.churchId.toString(),
      churchName: a.church.name,
      location: a.church.location ?? "",
      churchIsActive: a.church.isActive,
      isPrimary: a.isPrimary,
    }))
  );
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const pastorId = BigInt(id);

  const pastor = await db.user.findUnique({ where: { id: pastorId, role: "PASTOR" } });
  if (!pastor) {
    return NextResponse.json({ error: "Pasteur introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = AssignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { churchId: churchIdStr, isPrimary } = parsed.data;
  const churchId = BigInt(churchIdStr);

  const church = await db.church.findUnique({ where: { id: churchId } });
  if (!church || !church.isActive) {
    return NextResponse.json({ error: "Église introuvable ou inactive" }, { status: 404 });
  }

  const existing = await db.pastorChurch.findUnique({
    where: { pastorId_churchId: { pastorId, churchId } },
  });

  if (existing?.isActive) {
    return NextResponse.json(
      { error: "Ce pasteur est déjà affecté à cette église" },
      { status: 409 }
    );
  }

  await db.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.pastorChurch.updateMany({
        where: { churchId, isPrimary: true, isActive: true },
        data: { isPrimary: false },
      });
    }

    if (existing) {
      await tx.pastorChurch.update({
        where: { pastorId_churchId: { pastorId, churchId } },
        data: { isPrimary, isActive: true },
      });
    } else {
      await tx.pastorChurch.create({
        data: { pastorId, churchId, isPrimary },
      });
    }
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
