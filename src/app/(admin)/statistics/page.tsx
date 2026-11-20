import { db } from "@/lib/db";
import { getCurrentPeriod } from "@/lib/period";
import StatFilters from "./_components/StatFilters";
import StatCharts from "./_components/StatCharts";
import StatTable from "./_components/StatTable";
import ExportButtons from "./_components/ExportButtons";

export const metadata = { title: "Statistiques — ChurchTrack" };

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ church?: string; weeks?: string; status?: string }>;
}) {
  const params = await searchParams;
  const churchParam = params.church ?? "all";
  const weeksParam = params.weeks ?? "8";
  const statusParam = params.status ?? "submitted";

  const churches = await db.church.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const { weekStart } = getCurrentPeriod();

  let weekStartFilter: { gte: Date } | undefined;
  if (weeksParam !== "all") {
    const weeks = Math.min(Math.max(parseInt(weeksParam) || 8, 1), 52);
    const fromDate = new Date(weekStart);
    fromDate.setDate(fromDate.getDate() - weeks * 7);
    weekStartFilter = { gte: fromDate };
  }

  const reports = await db.weeklyReport.findMany({
    where: {
      ...(churchParam !== "all" ? { churchId: BigInt(churchParam) } : {}),
      ...(weekStartFilter ? { weekStart: weekStartFilter } : {}),
      ...(statusParam === "submitted" ? { status: "SUBMITTED" } : {}),
    },
    orderBy: [{ weekStart: "desc" }, { church: { name: "asc" } }],
    include: { church: { select: { name: true } } },
  });

  const serialized = reports.map((r) => ({
    id: r.id.toString(),
    churchId: r.churchId.toString(),
    churchName: r.church.name,
    weekStart: r.weekStart.toISOString(),
    weekEnd: r.weekEnd.toISOString(),
    attendance: r.attendance,
    newcomers: r.newcomers,
    salvationDecisions: r.salvationDecisions,
    churchIntegration: r.churchIntegration,
    tribeIntegration: r.tribeIntegration,
    servants: r.servants,
    status: r.status,
    submittedAt: r.submittedAt?.toISOString() ?? null,
  }));

  const submitted = serialized.filter((r) => r.status === "SUBMITTED");
  const totalAttendance = submitted.reduce((s, r) => s + r.attendance, 0);
  const totalNewcomers = submitted.reduce((s, r) => s + r.newcomers, 0);
  const totalDecisions = submitted.reduce((s, r) => s + r.salvationDecisions, 0);
  const totalServants = submitted.reduce((s, r) => s + r.servants, 0);
  const uniqueWeeks = new Set(submitted.map((r) => r.weekStart)).size;
  const avgAttendance = uniqueWeeks > 0 ? Math.round(totalAttendance / uniqueWeeks) : 0;

  // Per-church aggregates — sorted by total attendance desc
  const churchMap = new Map<
    string,
    { name: string; count: number; totalAttendance: number; totalNewcomers: number }
  >();
  for (const r of submitted) {
    if (!churchMap.has(r.churchId)) {
      churchMap.set(r.churchId, {
        name: r.churchName,
        count: 0,
        totalAttendance: 0,
        totalNewcomers: 0,
      });
    }
    const s = churchMap.get(r.churchId)!;
    s.count++;
    s.totalAttendance += r.attendance;
    s.totalNewcomers += r.newcomers;
  }
  const churchStats = [...churchMap.entries()]
    .map(([churchId, s]) => ({
      churchId,
      name: s.name,
      count: s.count,
      totalAttendance: s.totalAttendance,
      avgAttendance: s.count > 0 ? Math.round(s.totalAttendance / s.count) : 0,
      totalNewcomers: s.totalNewcomers,
    }))
    .sort((a, b) => b.totalAttendance - a.totalAttendance);

  const churchesForFilter = churches.map((c) => ({
    id: c.id.toString(),
    name: c.name,
  }));

  const fmtNum = (n: number) => n.toLocaleString("fr-FR");

  const periodLabel =
    weeksParam === "all"
      ? "Toute la période"
      : `${weeksParam} dernières semaines`;

  const churchStatsForExport = churchStats.map(({ churchId: _id, ...rest }) => rest);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analyse multicritères des rapports hebdomadaires
          </p>
        </div>
        <ExportButtons
          reports={serialized}
          churchStats={churchStatsForExport}
          periodLabel={periodLabel}
        />
      </div>

      <StatFilters
        churches={churchesForFilter}
        currentChurch={churchParam}
        currentWeeks={weeksParam}
        currentStatus={statusParam}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-6">
        <SummaryCard
          label="Présences totales"
          value={fmtNum(totalAttendance)}
          sub={`Moy. ${fmtNum(avgAttendance)}/semaine`}
        />
        <SummaryCard
          label="Nouveaux"
          value={fmtNum(totalNewcomers)}
          sub={`Sur ${submitted.length} rapport${submitted.length > 1 ? "s" : ""} soumis`}
        />
        <SummaryCard
          label="Décisions pour Jésus"
          value={fmtNum(totalDecisions)}
          sub={`${uniqueWeeks} semaine${uniqueWeeks > 1 ? "s" : ""} analysée${uniqueWeeks > 1 ? "s" : ""}`}
        />
        <SummaryCard
          label="Serviteurs"
          value={fmtNum(totalServants)}
          sub={`${churchStats.length} église${churchStats.length > 1 ? "s" : ""} représentée${churchStats.length > 1 ? "s" : ""}`}
        />
      </div>

      <StatCharts reports={serialized} />

      <StatTable reports={serialized} churchStats={churchStats} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
