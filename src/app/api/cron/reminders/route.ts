import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSundayOfWeek } from "@/lib/period";
import { sendPush } from "@/lib/webpush";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await db.appConfig.findUnique({ where: { id: 1 } });
  if (!config?.notificationsEnabled) {
    return NextResponse.json({ skipped: "notifications disabled" });
  }

  const windowDays = config.submissionWindowDays ?? 6;
  const reminderDays = config.reminderDaysBeforeClose ?? 1;

  const weekStart = getSundayOfWeek();

  const closeDate = new Date(weekStart);
  closeDate.setDate(closeDate.getDate() + windowDays);

  const reminderDate = new Date(closeDate);
  reminderDate.setDate(reminderDate.getDate() - reminderDays);

  // Normalize to midnight UTC for comparison
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  reminderDate.setUTCHours(0, 0, 0, 0);

  if (today.getTime() !== reminderDate.getTime()) {
    return NextResponse.json({
      skipped: "not reminder day",
      today: today.toISOString(),
      reminderDay: reminderDate.toISOString(),
    });
  }

  // Find churches without SUBMITTED reports for current week
  const [activeChurches, submittedReports] = await Promise.all([
    db.church.findMany({ where: { isActive: true }, select: { id: true } }),
    db.weeklyReport.findMany({
      where: { weekStart, status: "SUBMITTED" },
      select: { churchId: true },
    }),
  ]);

  const submittedIds = new Set(submittedReports.map((r) => r.churchId.toString()));
  const unsubmittedIds = activeChurches
    .filter((c) => !submittedIds.has(c.id.toString()))
    .map((c) => c.id);

  if (unsubmittedIds.length === 0) {
    return NextResponse.json({ sent: 0, reason: "all submitted" });
  }

  // Find pastors assigned to those churches (deduplicated)
  const assignments = await db.pastorChurch.findMany({
    where: { churchId: { in: unsubmittedIds }, isActive: true },
    select: { pastorId: true },
    distinct: ["pastorId"],
  });

  const pastorIds = assignments.map((a) => a.pastorId);

  // Get push subscriptions for those pastors
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId: { in: pastorIds } },
  });

  const closeLabel = closeDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await sendPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        {
          title: "Rapport non soumis — ChurchTrack",
          body:
            reminderDays === 0
              ? `Votre rapport doit être soumis aujourd'hui (${closeLabel}).`
              : `Votre rapport doit être soumis avant le ${closeLabel}. Il vous reste ${reminderDays} jour${reminderDays > 1 ? "s" : ""}.`,
          url: "/pastor/dashboard",
        }
      );
      sent++;
    } catch (err: unknown) {
      failed++;
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await db.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => {});
      }
    }
  }

  return NextResponse.json({
    sent,
    failed,
    unsubmittedChurches: unsubmittedIds.length,
  });
}
