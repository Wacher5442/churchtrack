import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  submissionWindowDays: z.number().int().min(1, "Minimum 1 jour").max(13, "Maximum 13 jours"),
  notificationsEnabled: z.boolean().optional(),
  reminderDaysBeforeClose: z.number().int().min(0).max(12).optional(),
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
    notificationsEnabled: config?.notificationsEnabled ?? true,
    reminderDaysBeforeClose: config?.reminderDaysBeforeClose ?? 1,
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
  const { submissionWindowDays, notificationsEnabled, reminderDaysBeforeClose } = parsed.data;

  const config = await db.appConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      submissionWindowDays,
      notificationsEnabled: notificationsEnabled ?? true,
      reminderDaysBeforeClose: reminderDaysBeforeClose ?? 1,
      updatedById: adminId,
    },
    update: {
      submissionWindowDays,
      ...(notificationsEnabled !== undefined && { notificationsEnabled }),
      ...(reminderDaysBeforeClose !== undefined && { reminderDaysBeforeClose }),
      updatedById: adminId,
    },
    include: { updatedBy: { select: { fullName: true } } },
  });

  return NextResponse.json({
    submissionWindowDays: config.submissionWindowDays,
    notificationsEnabled: config.notificationsEnabled,
    reminderDaysBeforeClose: config.reminderDaysBeforeClose,
    updatedAt: config.updatedAt,
    updatedBy: config.updatedBy?.fullName ?? null,
  });
}
