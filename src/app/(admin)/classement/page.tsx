import { db } from "@/lib/db";
import { getCurrentPeriod } from "@/lib/period";
import ClassementFilters from "./_components/ClassementFilters";
import RankingTable, { type ChurchRank } from "./_components/RankingTable";

export const metadata = { title: "Classement — ChurchTrack" };

type SortKey = "attendance" | "avg" | "newcomers" | "decisions" | "consistency";

function getSortValue(r: Omit<ChurchRank, "rank" | "sortValue" | "trend">, sortKey: SortKey): number {
  if (sortKey === "attendance") return r.totalAttendance;
  if (sortKey === "avg") return r.avgAttendance;
  if (sortKey === "newcomers") return r.totalNewcomers;
  if (sortKey === "decisions") return r.totalDecisions;
  return r.consistencyPct;
}

export default async function ClassementPage({
  searchParams,
}: {
  searchParams: Promise<{ weeks?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const weeksParam = params.weeks ?? "8";
  const sortParam = (params.sort ?? "attendance") as SortKey;

  const weeks = Math.min(Math.max(parseInt(weeksParam) || 8, 1), 52);

  const { weekStart } = getCurrentPeriod();

  // Période courante : les N dernières semaines
  const currentFrom = new Date(weekStart);
  currentFrom.setDate(currentFrom.getDate() - weeks * 7);

  // Période précédente : les N semaines avant la période courante
  const prevFrom = new Date(currentFrom);
  prevFrom.setDate(prevFrom.getDate() - weeks * 7);
  const prevTo = new Date(currentFrom);
  prevTo.setDate(prevTo.getDate() - 1);

  const [churches, currentReports, prevReports] = await Promise.all([
    db.church.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.weeklyReport.findMany({
      where: { weekStart: { gte: currentFrom }, status: "SUBMITTED" },
      select: {
        churchId: true,
        weekStart: true,
        attendance: true,
        newcomers: true,
        salvationDecisions: true,
      },
    }),
    db.weeklyReport.findMany({
      where: {
        weekStart: { gte: prevFrom, lte: prevTo },
        status: "SUBMITTED",
      },
      select: { churchId: true, attendance: true, newcomers: true, salvationDecisions: true },
    }),
  ]);

  // Semaines distinctes dans la période courante
  const distinctWeeks = new Set(currentReports.map((r) => r.weekStart.toISOString())).size;
  const periodWeeks = distinctWeeks || weeks;

  // Agréger par église — période courante
  const currentMap = new Map<
    string,
    { totalAttendance: number; totalNewcomers: number; totalDecisions: number; submittedWeeks: number }
  >();
  for (const r of currentReports) {
    const key = r.churchId.toString();
    if (!currentMap.has(key)) {
      currentMap.set(key, { totalAttendance: 0, totalNewcomers: 0, totalDecisions: 0, submittedWeeks: 0 });
    }
    const s = currentMap.get(key)!;
    s.totalAttendance += r.attendance;
    s.totalNewcomers += r.newcomers;
    s.totalDecisions += r.salvationDecisions;
    s.submittedWeeks += 1;
  }

  // Agréger par église — période précédente
  const prevMap = new Map<string, { totalAttendance: number; totalNewcomers: number; totalDecisions: number; count: number }>();
  for (const r of prevReports) {
    const key = r.churchId.toString();
    if (!prevMap.has(key)) prevMap.set(key, { totalAttendance: 0, totalNewcomers: 0, totalDecisions: 0, count: 0 });
    const s = prevMap.get(key)!;
    s.totalAttendance += r.attendance;
    s.totalNewcomers += r.newcomers;
    s.totalDecisions += r.salvationDecisions;
    s.count += 1;
  }

  // Construire les rangs pour toutes les églises actives
  const rawRanks = churches.map((church) => {
    const key = church.id.toString();
    const cur = currentMap.get(key);
    const prev = prevMap.get(key);

    const totalAttendance = cur?.totalAttendance ?? 0;
    const totalNewcomers = cur?.totalNewcomers ?? 0;
    const totalDecisions = cur?.totalDecisions ?? 0;
    const submittedWeeks = cur?.submittedWeeks ?? 0;
    const avgAttendance = submittedWeeks > 0 ? Math.round(totalAttendance / submittedWeeks) : 0;
    const consistencyPct = Math.round((submittedWeeks / periodWeeks) * 100);

    let trend: number | null = null;
    if (prev && prev.totalAttendance > 0 && totalAttendance > 0) {
      trend = ((totalAttendance - prev.totalAttendance) / prev.totalAttendance) * 100;
    }

    const newcomersDiff: number | null = prev != null ? totalNewcomers - prev.totalNewcomers : null;
    const decisionsDiff: number | null = prev != null ? totalDecisions - prev.totalDecisions : null;

    const base = { churchId: key, name: church.name, totalAttendance, avgAttendance, totalNewcomers, totalDecisions, submittedWeeks, consistencyPct, trend, newcomersDiff, decisionsDiff };
    return { ...base, sortValue: getSortValue(base, sortParam) };
  });

  // Trier et affecter les rangs — les églises sans rapport tombent en bas
  rawRanks.sort((a, b) => {
    if (a.sortValue === 0 && b.sortValue > 0) return 1;
    if (b.sortValue === 0 && a.sortValue > 0) return -1;
    return b.sortValue - a.sortValue;
  });

  const ranks: ChurchRank[] = rawRanks.map((r, i) => ({ ...r, rank: i + 1 }));
  const ranked = ranks.filter((r) => r.submittedWeeks > 0);
  const unranked = ranks.filter((r) => r.submittedWeeks === 0);

  const totalChurches = churches.length;
  const participatingChurches = ranked.length;

  return (
    <div className="p-6 lg:p-8">
      {/* En-tête */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classement des églises</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {participatingChurches}/{totalChurches} église{totalChurches > 1 ? "s" : ""} avec des rapports sur les {weeks} dernières semaines
          </p>
        </div>
      </div>

      <ClassementFilters currentWeeks={weeksParam} currentSort={sortParam} />

      {/* Tableau */}
      <div className="mt-6">
        <RankingTable ranks={ranked} sortKey={sortParam} periodWeeks={periodWeeks} />

        {/* Églises sans rapport */}
        {unranked.length > 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-white p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Aucun rapport sur la période
            </p>
            <div className="flex flex-wrap gap-2">
              {unranked.map((r) => (
                <span
                  key={r.churchId}
                  className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1"
                >
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

