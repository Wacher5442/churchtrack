import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCurrentPeriod } from "@/lib/period";
import Link from "next/link";
import { INDICATOR_LABELS, type IndicatorKey } from "@/lib/variations";

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

  const fmtPeriod = (start: Date, end: Date) => {
    const s = start.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    const e = end.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    return `Semaine du ${s} au ${e}`;
  };

  const fmtShort = (n: number | null) =>
    n === null ? "—" : n.toLocaleString("fr-FR");

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
        <div className="space-y-8">
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
                      report={{
                        attendance: r.attendance,
                        newcomers: r.newcomers,
                        salvationDecisions: r.salvationDecisions,
                        churchIntegration: r.churchIntegration,
                        tribeIntegration: r.tribeIntegration,
                        servants: r.servants,
                        status: r.status,
                        submittedAt: r.submittedAt?.toISOString() ?? null,
                      }}
                      isCurrentWeek={isCurrentWeek}
                      periodOpen={periodOpen}
                      fmtShort={fmtShort}
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
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-2 shrink-0">
          {isCurrentWeek && (
            <span className="text-xs font-semibold text-primary bg-primary-subtle border border-primary/20 rounded-full px-2 py-0.5">
              Semaine actuelle
            </span>
          )}
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">
            {submittedCount}/{totalCount} soumis
          </span>
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ReportCard({
  churchId,
  churchName,
  isPrimary,
  report,
  isCurrentWeek,
  periodOpen,
  fmtShort,
}: {
  churchId: string;
  churchName: string;
  isPrimary: boolean;
  report: {
    attendance: number;
    newcomers: number;
    salvationDecisions: number;
    churchIntegration: number;
    tribeIntegration: number;
    servants: number;
    status: string;
    submittedAt: string | null;
  };
  isCurrentWeek: boolean;
  periodOpen: boolean;
  fmtShort: (n: number | null) => string;
}) {
  const isSubmitted = report.status === "SUBMITTED";
  const isDraft = report.status === "DRAFT";
  const canEdit = isCurrentWeek && periodOpen && !isSubmitted;

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground text-sm">{churchName}</span>
          {isPrimary ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-subtle px-2 py-0.5 text-[11px] font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Principal
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Délégué
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isSubmitted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Soumis
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Brouillon
            </span>
          )}
        </div>
      </div>

      {/* Indicators grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {INDICATORS.map((key) => (
          <div key={key} className="rounded-lg bg-neutral-50 border border-border px-3 py-2">
            <p className="text-xs text-muted-foreground mb-0.5 truncate">
              {INDICATOR_LABELS[key]}
            </p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {fmtShort(report[key as keyof typeof report] as number)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        {isSubmitted && report.submittedAt && (
          <p className="text-xs text-muted-foreground">
            Soumis le{" "}
            {new Date(report.submittedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        {isDraft && <p className="text-xs text-muted-foreground">Brouillon non soumis</p>}

        {canEdit && (
          <Link
            href={`/pastor/rapports/${churchId}`}
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            {isDraft ? "Continuer" : "Saisir"}
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
    <div className="rounded-xl border border-dashed border-border bg-white p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground text-sm">{churchName}</span>
        {isPrimary ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-subtle px-2 py-0.5 text-[11px] font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Principal
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Délégué
          </span>
        )}
        <span className="text-xs text-muted-foreground">· Rapport non commencé</span>
      </div>
      <Link
        href={`/pastor/rapports/${churchId}`}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors"
      >
        Saisir
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
