import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getWeekEnd } from "@/lib/period";

const schema = z.object({
  churchId: z.string(),
  weekStart: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const churchId = BigInt(parsed.data.churchId);
  const weekStart = new Date(parsed.data.weekStart);
  const weekEnd = getWeekEnd(weekStart);
  const now = new Date();

  const report = await db.weeklyReport.upsert({
    where: { churchId_weekStart: { churchId, weekStart } },
    create: {
      churchId,
      weekStart,
      weekEnd,
      attendance: 0,
      newcomers: 0,
      salvationDecisions: 0,
      churchIntegration: 0,
      tribeIntegration: 0,
      servants: 0,
      periodUnlockedAt: now,
    },
    update: { periodUnlockedAt: now },
    select: { id: true, periodUnlockedAt: true },
  });

  return NextResponse.json({
    id: report.id.toString(),
    periodUnlockedAt: report.periodUnlockedAt?.toISOString() ?? null,
  });
}
