import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getCurrentPeriod } from "@/lib/period";
import { isPastorAssignedToChurch } from "@/lib/permissions";

const reportSchema = z.object({
  attendance: z.number().int().min(0),
  newcomers: z.number().int().min(0),
  salvationDecisions: z.number().int().min(0),
  churchIntegration: z.number().int().min(0),
  tribeIntegration: z.number().int().min(0),
  servants: z.number().int().min(0),
  action: z.enum(["draft", "submit"]),
});

type Params = { params: Promise<{ churchId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PASTOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { churchId: churchIdStr } = await params;
  const pastorId = BigInt(session.user.id!);
  const churchId = BigInt(churchIdStr);

  const hasAccess = await isPastorAssignedToChurch(pastorId, churchId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { weekStart } = getCurrentPeriod();

  const report = await db.weeklyReport.findUnique({
    where: { churchId_weekStart: { churchId, weekStart } },
  });

  if (!report) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    id: report.id.toString(),
    churchId: report.churchId.toString(),
    weekStart: report.weekStart.toISOString(),
    weekEnd: report.weekEnd.toISOString(),
    attendance: report.attendance,
    newcomers: report.newcomers,
    salvationDecisions: report.salvationDecisions,
    churchIntegration: report.churchIntegration,
    tribeIntegration: report.tribeIntegration,
    servants: report.servants,
    status: report.status,
    submittedAt: report.submittedAt?.toISOString() ?? null,
    updatedAt: report.updatedAt.toISOString(),
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PASTOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { churchId: churchIdStr } = await params;
  const pastorId = BigInt(session.user.id!);
  const churchId = BigInt(churchIdStr);

  const hasAccess = await isPastorAssignedToChurch(pastorId, churchId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { attendance, newcomers, salvationDecisions, churchIntegration, tribeIntegration, servants, action } = parsed.data;
  const { weekStart, weekEnd } = getCurrentPeriod();

  // Check if already submitted
  const existing = await db.weeklyReport.findUnique({
    where: { churchId_weekStart: { churchId, weekStart } },
    select: { id: true, status: true, periodUnlockedAt: true },
  });

  if (existing?.status === "SUBMITTED") {
    return NextResponse.json({ error: "Ce rapport a déjà été soumis." }, { status: 409 });
  }

  // Check period is open (unless unlocked)
  const config = await db.appConfig.findUnique({ where: { id: 1 } });
  const windowDays = config?.submissionWindowDays ?? 6;
  const closeDate = new Date(weekStart);
  closeDate.setDate(closeDate.getDate() + windowDays);
  closeDate.setHours(23, 59, 59, 999);

  const isUnlocked = !!existing?.periodUnlockedAt;
  const periodOpen = new Date() <= closeDate;

  if (!periodOpen && !isUnlocked) {
    return NextResponse.json({ error: "La période de saisie est fermée." }, { status: 403 });
  }

  const isSubmit = action === "submit";
  const data = {
    attendance,
    newcomers,
    salvationDecisions,
    churchIntegration,
    tribeIntegration,
    servants,
    weekEnd,
    ...(isSubmit && {
      status: "SUBMITTED" as const,
      submittedById: pastorId,
      submittedAt: new Date(),
    }),
  };

  const report = await db.weeklyReport.upsert({
    where: { churchId_weekStart: { churchId, weekStart } },
    create: { churchId, weekStart, ...data },
    update: data,
  });

  return NextResponse.json({
    id: report.id.toString(),
    status: report.status,
    updatedAt: report.updatedAt.toISOString(),
    submittedAt: report.submittedAt?.toISOString() ?? null,
  });
}
