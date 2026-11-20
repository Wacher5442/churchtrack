import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCurrentPeriod } from "@/lib/period";
import Link from "next/link";
import { type IndicatorKey } from "@/lib/variations";
import DiffBadge from "@/components/ui/DiffBadge";

export const metadata = { title: "Mes rapports — ChurchTrack" };

const INDICATORS: IndicatorKey[] = [
  "attendance",
  "newcomers",
  "salvationDecisions",
  "churchIntegration",
  "tribeIntegration",
  "servants",
];

export default async function RapportsPage() {
  const session = await auth();
  const pastorId = BigInt(session!.user.id!);

  const [assignments, config] = await Promise.all([
    db.pastorChurch.findMany({
      where: { pastorId, isActive: true },
      include: { church: { select: { id: true, name: true } } },
      orderBy: [{ isPrimary: "desc" }, { church: { name: "asc" } }],
    }),
    db.appConfig.findUnique({ where: { id: 1 } }),
  ]);

  const churchIds = assignments.map((a) => a.churchId);
  const assignmentMap = new Map(
    assignments.map((a) => [
      a.churchId.toString(),
      { name: a.church.name, isPrimary: a.isPrimary },
    ])
  );

  const reports =
    churchIds.length > 0
      ? await db.weeklyReport.findMany({
          where: { churchId: { in: churchIds } },
          orderBy: [{ weekStart: "desc" }],
          take: 300,
        })
      : [];

  // Current period info
  const { weekStart } = getCurrentPeriod();
  const windowDays = config?.submissionWindowDays ?? 6;
  const closeDate = new Date(weekStart);
  closeDate.setDate(closeDate.getDate() + windowDays);
  closeDate.setHours(23, 59, 59, 999);
  const periodOpen = new Date() <= closeDate;
  const currentWeekKey = weekStart.toISOString().slice(0, 10);

  // Group reports by weekStart
  const grouped = new Map<
    string,
    { weekStart: Date; weekEnd: Date; reports: typeof reports }
  >();

  for (const r of reports) {
    const key = r.weekStart.toISOString().slice(0, 10);
    if (!grouped.has(key)) {
      grouped.set(key, { weekStart: r.weekStart, weekEnd: r.weekEnd, reports: [] });
    }
    grouped.get(key)!.reports.push(r);
  }

  // Add current week if not in reports yet (open period, no report)
  const currentChurchesWithReport = new Set(
    (grouped.get(currentWeekKey)?.reports ?? []).map((r) => r.churchId.toString())
  );
  const churchesWithNoCurrentReport = assignments.filter(
    (a) => !currentChurchesWithReport.has(a.churchId.toString())
  );

  // Pour chaque rapport, calculer les valeurs du rapport soumis précédent de la même église.
  // Les rapports sont triés weekStart DESC — on parcourt du plus ancien au plus récent.
  type PrevValues = {
    attendance: number; newcomers: number; salvationDecisions: number;
    churchIntegration: number; tribeIntegration: number; servants: number;
  };
  const prevByReportId = new Map<string, PrevValues>();
  const lastSubmittedByChurch = new Map<string, typeof reports[0]>();

  for (let i = reports.length - 1; i >= 0; i--) {
    const r = reports[i];
    const key = r.churchId.toString();
    const prev = lastSubmittedByChurch.get(key);
    if (prev) {
      prevByReportId.set(r.id.toString(), {
        attendance: prev.attendance,
        newcomers: prev.newcomers,
        salvationDecisions: prev.salvationDecisions,
        churchIntegration: prev.churchIntegration,
        tribeIntegration: prev.tribeIntegration,
        servants: prev.servants,
      });
    }
    if (r.status === "SUBMITTED") {
      lastSubmittedByChurch.set(key, r);
    }
  }

  const fmtPeriod = (start: Date, end: Date) => {
    const s = start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    const e = end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    return `${s} – ${e}`;
  };

  const weeks = [...grouped.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes rapports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Historique de toutes vos saisies
          </p>
        </div>
        {periodOpen && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Période ouverte
          </span>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground">
          Aucune église affectée.
        </div>
      ) : weeks.length === 0 && !periodOpen ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground">
          Aucun rapport trouvé.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current week — churches with no report yet */}
          {periodOpen && churchesWithNoCurrentReport.length > 0 && !grouped.has(currentWeekKey) && (
            <WeekSection
              label={fmtPeriod(weekStart, new Date(weekStart.getTime() + 6 * 86400000))}
              isCurrentWeek
              submittedCount={0}
              totalCount={assignments.length}
            >
              {churchesWithNoCurrentReport.map((a) => (
                <PendingCard
                  key={a.churchId.toString()}
                  churchId={a.churchId.toString()}
                  churchName={a.church.name}
                  isPrimary={a.isPrimary}
                />
              ))}
            </WeekSection>
          )}

          {weeks.map(([weekKey, { weekStart: ws, weekEnd: we, reports: wReports }]) => {
            const isCurrentWeek = weekKey === currentWeekKey;
            const submittedCount = wReports.filter((r) => r.status === "SUBMITTED").length;
            const totalCount = assignments.length;

            return (
              <WeekSection
                key={weekKey}
                label={fmtPeriod(ws, we)}
                isCurrentWeek={isCurrentWeek}
                submittedCount={submittedCount}
                totalCount={totalCount}
              >
                {wReports.map((r) => {
                  const church = assignmentMap.get(r.churchId.toString());
                  return (
                    <ReportCard
                      key={r.id.toString()}
                      churchId={r.churchId.toString()}
                      churchName={church?.name ?? "—"}
                      isPrimary={church?.isPrimary ?? false}
                      weekKey={weekKey}
                      report={{
                        attendance: r.attendance,
                        newcomers: r.newcomers,
                        salvationDecisions: r.salvationDecisions,
                        churchIntegration: r.churchIntegration,
                        tribeIntegration: r.tribeIntegration,
                        servants: r.servants,
                        status: r.status,
                        submittedAt: r.submittedAt?.toISOString() ?? null,
                        periodUnlockedAt: r.periodUnlockedAt?.toISOString() ?? null,
                      }}
                      prevValues={prevByReportId.get(r.id.toString()) ?? null}
                      isCurrentWeek={isCurrentWeek}
                      periodOpen={periodOpen}
                    />
                  );
                })}
                {/* Current week: churches with no report */}
                {isCurrentWeek &&
                  churchesWithNoCurrentReport.map((a) => (
                    <PendingCard
                      key={a.churchId.toString()}
                      churchId={a.churchId.toString()}
                      churchName={a.church.name}
                      isPrimary={a.isPrimary}
                    />
                  ))}
              </WeekSection>
            );
          })}
        </div>
      )}
    </div>
  );
}

const SHORT_LABELS: Record<IndicatorKey, string> = {
  attendance: "Présences",
  newcomers: "Nouveaux",
  salvationDecisions: "Décisions",
  churchIntegration: "Int. Église",
  tribeIntegration: "Int. Tribus",
  servants: "Serviteurs",
};

function WeekSection({
  label,
  isCurrentWeek,
  submittedCount,
  totalCount,
  children,
}: {
  label: string;
  isCurrentWeek: boolean;
  submittedCount: number;
  totalCount: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2 shrink-0">
          {isCurrentWeek && (
            <span className="text-[11px] font-semibold text-primary bg-primary-subtle border border-primary/20 rounded-full px-2 py-0.5">
              Actuelle
            </span>
          )}
          <span className="text-xs font-semibold text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">
            {submittedCount}/{totalCount}
          </span>
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

type PrevValues = {
  attendance: number; newcomers: number; salvationDecisions: number;
  churchIntegration: number; tribeIntegration: number; servants: number;
};

function ReportCard({
  churchId,
  churchName,
  isPrimary,
  weekKey,
  report,
  prevValues,
  isCurrentWeek,
  periodOpen,
}: {
  churchId: string;
  churchName: string;
  isPrimary: boolean;
  weekKey: string;
  report: {
    attendance: number;
    newcomers: number;
    salvationDecisions: number;
    churchIntegration: number;
    tribeIntegration: number;
    servants: number;
    status: string;
    submittedAt: string | null;
    periodUnlockedAt: string | null;
  };
  prevValues: PrevValues | null;
  isCurrentWeek: boolean;
  periodOpen: boolean;
}) {
  const isSubmitted = report.status === "SUBMITTED";
  const isDraft = report.status === "DRAFT";
  const isUnlocked = !!report.periodUnlockedAt;
  const canEdit = !isSubmitted && ((isCurrentWeek && periodOpen) || (!isCurrentWeek && isUnlocked));
  const editHref = `/pastor/rapports/${churchId}${!isCurrentWeek && isUnlocked ? `?week=${weekKey}` : ""}`;

  // Bordures internes de la grille 3-col mobile / 6-col desktop
  const cellBorder = (i: number) => {
    if (i === 0) return "";
    if (i === 1 || i === 2) return "border-l border-border";
    if (i === 3) return "border-t border-border sm:border-t-0 sm:border-l";
    return "border-l border-t border-border sm:border-t-0"; // i = 4, 5
  };

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* En-tête */}
      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-foreground text-sm truncate">{churchName}</span>
          {isPrimary ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-subtle px-2 py-0.5 text-[11px] font-semibold text-primary shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />Principal
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground shrink-0">
              Délégué
            </span>
          )}
        </div>
        {isSubmitted ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-success shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />Soumis
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Brouillon
          </span>
        )}
      </div>

      {/* Grille indicateurs */}
      <div className="border-t border-border">
        <div className="grid grid-cols-3 sm:grid-cols-6">
          {INDICATORS.map((key, i) => {
            const val = report[key as keyof typeof report] as number;
            const diff = prevValues != null
              ? val - (prevValues[key as keyof PrevValues] as number)
              : null;
            return (
              <div key={key} className={`py-3.5 px-1 text-center ${cellBorder(i)}`}>
                <p className="text-base font-bold text-foreground tabular-nums leading-none">
                  {val.toLocaleString("fr-FR")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                  {SHORT_LABELS[key]}
                </p>
                {diff !== null && (
                  <div className="mt-0.5 flex items-center justify-center">
                    <DiffBadge diff={diff} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pied */}
      <div className="border-t border-border px-4 py-2.5 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {isSubmitted && report.submittedAt
            ? `Soumis le ${new Date(report.submittedAt).toLocaleDateString("fr-FR", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              })}`
            : isDraft
            ? "Brouillon non soumis"
            : ""}
        </p>
        {canEdit && (
          <Link
            href={editHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
          >
            {isDraft ? "Continuer" : "Modifier"}
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

function PendingCard({
  churchId,
  churchName,
  isPrimary,
}: {
  churchId: string;
  churchName: string;
  isPrimary: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-3.5 flex items-center gap-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="font-semibold text-foreground text-sm truncate">{churchName}</span>
        {isPrimary ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-subtle px-2 py-0.5 text-[11px] font-semibold text-primary shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />Principal
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground shrink-0">
            Délégué
          </span>
        )}
      </div>
      <span className="hidden sm:block text-xs text-muted-foreground shrink-0">Non commencé</span>
      <Link
        href={`/pastor/rapports/${churchId}`}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors"
      >
        Saisir
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
