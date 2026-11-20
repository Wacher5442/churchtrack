import { db } from "@/lib/db";
import { getCurrentPeriod, getSundayOfWeek, getWeekEnd } from "@/lib/period";
import ReportsClient, { type ReportRow } from "./_components/ReportsClient";

export const metadata = { title: "Rapports — ChurchTrack" };

function fmtWeekLabel(weekStart: Date): string {
  const weekEnd = getWeekEnd(weekStart);
  const s = weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const e = weekEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  return `${s} – ${e}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  const { weekStart: currentWeekStart } = getCurrentPeriod();

  // Semaine sélectionnée (par défaut : semaine courante)
  let selectedWeekStart: Date;
  if (params.week) {
    const parsed = new Date(params.week);
    selectedWeekStart = isNaN(parsed.getTime())
      ? currentWeekStart
      : getSundayOfWeek(parsed);
  } else {
    selectedWeekStart = currentWeekStart;
  }
  selectedWeekStart.setHours(0, 0, 0, 0);

  // Générer les 13 dernières semaines disponibles
  const availableWeeks = Array.from({ length: 13 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - i * 7);
    const label = i === 0 ? `Semaine courante — ${fmtWeekLabel(d)}` : fmtWeekLabel(d);
    return { label, value: d.toISOString().slice(0, 10) };
  });

  // Calculer si la période sélectionnée est ouverte
  const config = await db.appConfig.findUnique({ where: { id: 1 } });
  const windowDays = config?.submissionWindowDays ?? 6;
  const closeDate = new Date(selectedWeekStart);
  closeDate.setDate(closeDate.getDate() + windowDays);
  closeDate.setHours(23, 59, 59, 999);
  const periodOpen = new Date() <= closeDate;

  const [churches, reports] = await Promise.all([
    db.church.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        pastors: {
          where: { isActive: true, isPrimary: true },
          include: { pastor: { select: { fullName: true } } },
        },
      },
    }),
    db.weeklyReport.findMany({
      where: { weekStart: selectedWeekStart },
      include: {
        submittedBy: { select: { fullName: true } },
      },
    }),
  ]);

  const reportMap = new Map(
    reports.map((r) => [r.churchId.toString(), r])
  );

  const rows: ReportRow[] = churches.map((church) => {
    const churchId = church.id.toString();
    const r = reportMap.get(churchId);
    const primaryPastor = church.pastors[0]?.pastor?.fullName ?? null;

    return {
      churchId,
      churchName: church.name,
      primaryPastor,
      report: r
        ? {
            id: r.id.toString(),
            attendance: r.attendance,
            newcomers: r.newcomers,
            salvationDecisions: r.salvationDecisions,
            churchIntegration: r.churchIntegration,
            tribeIntegration: r.tribeIntegration,
            servants: r.servants,
            status: r.status,
            submittedAt: r.submittedAt?.toISOString() ?? null,
            submittedByName: r.submittedBy?.fullName ?? null,
            isUnlocked: !!r.periodUnlockedAt,
          }
        : null,
    };
  });

  const submittedCount = rows.filter((r) => r.report?.status === "SUBMITTED").length;
  const selectedWeekKey = selectedWeekStart.toISOString().slice(0, 10);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Rapports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Consultation et gestion des rapports hebdomadaires
        </p>
      </div>

      <ReportsClient
        rows={rows}
        selectedWeek={selectedWeekKey}
        periodOpen={periodOpen}
        availableWeeks={availableWeeks}
        submittedCount={submittedCount}
        totalCount={churches.length}
      />
    </div>
  );
}
