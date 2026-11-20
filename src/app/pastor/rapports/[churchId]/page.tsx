import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getCurrentPeriod, getWeekEnd } from "@/lib/period";
import { isPastorAssignedToChurch } from "@/lib/permissions";
import ReportForm from "./_components/ReportForm";

type Params = {
  params: Promise<{ churchId: string }>;
  searchParams: Promise<{ week?: string }>;
};

export async function generateMetadata({ params }: Params) {
  const { churchId } = await params;
  const church = await db.church.findUnique({
    where: { id: BigInt(churchId) },
    select: { name: true },
  });
  return { title: `${church?.name ?? "Rapport"} — ChurchTrack` };
}

export default async function ReportPage({ params, searchParams }: Params) {
  const session = await auth();
  const { churchId: churchIdStr } = await params;
  const { week } = await searchParams;

  const pastorId = BigInt(session!.user.id!);
  const churchId = BigInt(churchIdStr);

  const [hasAccess, church, config] = await Promise.all([
    isPastorAssignedToChurch(pastorId, churchId),
    db.church.findUnique({
      where: { id: churchId },
      select: { id: true, name: true, location: true },
    }),
    db.appConfig.findUnique({ where: { id: 1 } }),
  ]);

  if (!hasAccess || !church) redirect("/pastor/dashboard");

  const { weekStart: currentWeekStart, weekEnd: currentWeekEnd } = getCurrentPeriod();
  const windowDays = config?.submissionWindowDays ?? 6;

  // Semaine cible : courante par défaut, ou semaine passée débloquée via ?week=
  const isUnlockedPastWeek = !!week;
  const weekStart = isUnlockedPastWeek ? new Date(week!) : currentWeekStart;
  const weekEnd = isUnlockedPastWeek ? getWeekEnd(weekStart) : currentWeekEnd;

  // Sécurité : pour une semaine passée, vérifier que le rapport est bien débloqué
  if (isUnlockedPastWeek) {
    const unlockedReport = await db.weeklyReport.findUnique({
      where: { churchId_weekStart: { churchId, weekStart } },
      select: { periodUnlockedAt: true, status: true },
    });
    if (!unlockedReport?.periodUnlockedAt || unlockedReport.status === "SUBMITTED") {
      redirect("/pastor/dashboard");
    }
  }

  // Période ouverte : toujours vraie pour une semaine débloquée
  const closeDate = new Date(currentWeekStart);
  closeDate.setDate(closeDate.getDate() + windowDays);
  closeDate.setHours(23, 59, 59, 999);
  const periodOpen = isUnlockedPastWeek ? true : new Date() <= closeDate;

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const [existing, previous] = await Promise.all([
    db.weeklyReport.findUnique({ where: { churchId_weekStart: { churchId, weekStart } } }),
    db.weeklyReport.findUnique({ where: { churchId_weekStart: { churchId, weekStart: prevWeekStart } } }),
  ]);

  const toReportData = (r: typeof existing) =>
    r
      ? {
          id: r.id.toString(),
          attendance: r.attendance,
          newcomers: r.newcomers,
          salvationDecisions: r.salvationDecisions,
          churchIntegration: r.churchIntegration,
          tribeIntegration: r.tribeIntegration,
          servants: r.servants,
          status: r.status as "DRAFT" | "SUBMITTED",
          submittedAt: r.submittedAt?.toISOString() ?? null,
          updatedAt: r.updatedAt.toISOString(),
        }
      : null;

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="px-4 py-5 sm:p-6 lg:p-8">
      <ReportForm
        churchId={churchIdStr}
        churchName={church.name}
        location={church.location ?? ""}
        weekStart={weekStart.toISOString()}
        weekEnd={weekEnd.toISOString()}
        weekLabel={`Semaine du ${fmtDate(weekStart)} au ${fmtDate(weekEnd)}`}
        periodOpen={periodOpen}
        closeDate={closeDate.toISOString()}
        isUnlockedPastWeek={isUnlockedPastWeek}
        initialReport={toReportData(existing)}
        previousReport={toReportData(previous)}
      />
    </div>
  );
}
