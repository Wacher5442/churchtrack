import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  submissionWindowDays: z
    .number()
    .int()
    .min(1, "Minimum 1 jour")
    .max(13, "Maximum 13 jours"),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const config = await db.appConfig.findUnique({
    where: { id: 1 },
    include: { updatedBy: { select: { fullName: true } } },
  });

  return NextResponse.json({
    submissionWindowDays: config?.submissionWindowDays ?? 6,
    updatedAt: config?.updatedAt ?? null,
    updatedBy: config?.updatedBy?.fullName ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const adminId = BigInt(session.user.id!);

  const config = await db.appConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      submissionWindowDays: parsed.data.submissionWindowDays,
      updatedById: adminId,
    },
    update: {
      submissionWindowDays: parsed.data.submissionWindowDays,
      updatedById: adminId,
    },
    include: { updatedBy: { select: { fullName: true } } },
  });

  return NextResponse.json({
    submissionWindowDays: config.submissionWindowDays,
    updatedAt: config.updatedAt,
    updatedBy: config.updatedBy?.fullName ?? null,
  });
}
