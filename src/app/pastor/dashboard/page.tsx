import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCurrentPeriod } from "@/lib/period";
import Link from "next/link";
import ChurchReportCard from "./_components/ChurchReportCard";
import PeriodBanner from "./_components/PeriodBanner";

export const metadata = { title: "Tableau de bord — ChurchTrack" };

export default async function PastorDashboardPage() {
  const session = await auth();
  const pastorId = BigInt(session!.user.id!);

  const [assignments, config] = await Promise.all([
    db.pastorChurch.findMany({
      where: { pastorId, isActive: true },
      include: {
        church: { select: { id: true, name: true, location: true, isActive: true } },
      },
      orderBy: [{ isPrimary: "desc" }, { church: { name: "asc" } }],
    }),
    db.appConfig.findUnique({ where: { id: 1 } }),
  ]);

  const { weekStart, weekEnd } = getCurrentPeriod();
  const windowDays = config?.submissionWindowDays ?? 6;

  const closeDate = new Date(weekStart);
  closeDate.setDate(closeDate.getDate() + windowDays);
  closeDate.setHours(23, 59, 59, 999);
  const periodOpen = new Date() <= closeDate;

  const churchIds = assignments.map((a) => a.churchId);

  const [reports, trendReports, unlockedPastReports] = await Promise.all([
    churchIds.length > 0
      ? db.weeklyReport.findMany({
          where: { churchId: { in: churchIds }, weekStart },
          select: { id: true, churchId: true, status: true },
        })
      : Promise.resolve([]),
    churchIds.length > 0
      ? db.weeklyReport.findMany({
          where: { churchId: { in: churchIds }, status: "SUBMITTED" },
          orderBy: { weekStart: "desc" },
          take: churchIds.length * 8,
          select: { churchId: true, weekStart: true, attendance: true },
        })
      : Promise.resolve([]),
    // Rapports de semaines passées débloqués par l'admin, non encore soumis
    churchIds.length > 0
      ? db.weeklyReport.findMany({
          where: {
            churchId: { in: churchIds },
            periodUnlockedAt: { not: null },
            status: "DRAFT",
            weekStart: { lt: weekStart },
          },
          select: { id: true, churchId: true, weekStart: true, weekEnd: true },
          orderBy: { weekStart: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const reportByChurch = new Map(reports.map((r) => [r.churchId.toString(), r]));
  const churchByIdMap = new Map(assignments.map((a) => [a.churchId.toString(), a.church]));

  const submittedCount = reports.filter((r) => r.status === "SUBMITTED").length;
  const draftCount = reports.filter((r) => r.status === "DRAFT").length;
  const pendingCount = assignments.length - reports.length;

  // Build per-church trend data (last 8 submitted weeks)
  type WeekPoint = { weekStart: Date; attendance: number };
  const trendByChurch = new Map<string, WeekPoint[]>();
  for (const r of trendReports) {
    const key = r.churchId.toString();
    if (!trendByChurch.has(key)) trendByChurch.set(key, []);
    const pts = trendByChurch.get(key)!;
    if (pts.length < 8) pts.push({ weekStart: r.weekStart, attendance: r.attendance });
  }
  // Reverse so oldest → newest (chart reads left to right)
  trendByChurch.forEach((pts) => pts.reverse());

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });

  const hasTrends = [...trendByChurch.values()].some((pts) => pts.length >= 2);

  return (
    <div className="p-6 lg:p-8">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Bonjour, {session?.user?.name ?? "Pasteur"}&nbsp;👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Semaine du{" "}
          <span className="font-medium text-foreground">{fmtDate(weekStart)}</span>
          {" "}au{" "}
          <span className="font-medium text-foreground">{fmtDate(weekEnd)}</span>
        </p>
      </div>

      {/* Bannière période */}
      <PeriodBanner
        isOpen={periodOpen}
        closeDate={closeDate.toISOString()}
        windowDays={windowDays}
      />

      {/* Stats */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
          <StatCard label="Églises" value={assignments.length} color="neutral" />
          <StatCard label="Soumis" value={submittedCount} color="success" />
          <StatCard
            label={pendingCount + draftCount > 0 ? "En attente" : "Complet"}
            value={pendingCount + draftCount}
            color={pendingCount + draftCount > 0 ? "warning" : "success"}
          />
        </div>
      )}

      {/* Rapports passés débloqués par l'admin */}
      {unlockedPastReports.length > 0 && (
        <div className="mb-8">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100">
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-amber-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </span>
              Rapport{unlockedPastReports.length > 1 ? "s" : ""} débloqué{unlockedPastReports.length > 1 ? "s" : ""}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {unlockedPastReports.length > 1
                ? "Ces semaines ont été rouvertes par l'administrateur."
                : "Cette semaine a été rouverte par l'administrateur."}
            </p>
          </div>
          <div className="space-y-3">
            {unlockedPastReports.map((r) => {
              const church = churchByIdMap.get(r.churchId.toString());
              const weekKey = r.weekStart.toISOString().slice(0, 10);
              const href = `/pastor/rapports/${r.churchId}?week=${weekKey}`;
              const fmtShort = (d: Date) =>
                d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
              return (
                <div
                  key={r.id.toString()}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {church?.name ?? "—"}
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Semaine du {fmtShort(r.weekStart)} au {fmtShort(r.weekEnd)}
                    </p>
                  </div>
                  <Link
                    href={href}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-hover transition-colors"
                  >
                    Saisir
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste des rapports */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Rapports de cette semaine</h2>
        <p className="text-sm text-muted-foreground">
          {assignments.length} église{assignments.length > 1 ? "s" : ""} affectée{assignments.length > 1 ? "s" : ""}
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune église ne vous a encore été affectée.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const report = reportByChurch.get(a.churchId.toString()) ?? null;
            return (
              <ChurchReportCard
                key={a.churchId.toString()}
                churchId={a.churchId.toString()}
                churchName={a.church.name}
                location={a.church.location ?? ""}
                isPrimary={a.isPrimary}
                report={report ? { id: report.id.toString(), status: report.status } : null}
                periodOpen={periodOpen}
              />
            );
          })}
        </div>
      )}

      {/* Section tendances */}
      {hasTrends && (
        <div className="mt-10">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Tendances — présences</h2>
            <p className="text-sm text-muted-foreground">8 dernières semaines soumises</p>
          </div>
          <div className="space-y-3">
            {assignments.map((a) => {
              const pts = trendByChurch.get(a.churchId.toString()) ?? [];
              if (pts.length < 2) return null;
              const maxVal = Math.max(...pts.map((p) => p.attendance), 1);
              const latest = pts[pts.length - 1].attendance;
              const prev = pts[pts.length - 2].attendance;
              const diff = latest - prev;
              const pct = prev > 0 ? Math.round((diff / prev) * 100) : 0;
              return (
                <div
                  key={a.churchId.toString()}
                  className="rounded-xl border border-border bg-white px-4 py-3.5 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-5"
                >
                  {/* Church name */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{a.church.name}</p>
                    {a.church.location && (
                      <p className="text-xs text-muted-foreground truncate">{a.church.location}</p>
                    )}
                  </div>

                  {/* Sparkline */}
                  <div className="flex items-end gap-[3px] h-9 shrink-0">
                    {pts.map((p, i) => {
                      const isLast = i === pts.length - 1;
                      const heightPct = Math.max(Math.round((p.attendance / maxVal) * 100), 6);
                      return (
                        <div
                          key={i}
                          className={`w-2 rounded-sm transition-all ${
                            isLast ? "bg-primary" : "bg-primary/30"
                          }`}
                          style={{ height: `${heightPct}%` }}
                          title={`${p.attendance} présences`}
                        />
                      );
                    })}
                  </div>

                  {/* Latest value + trend */}
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-foreground tabular-nums">{latest.toLocaleString("fr-FR")}</p>
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                        diff > 0
                          ? "text-success"
                          : diff < 0
                          ? "text-danger"
                          : "text-muted-foreground"
                      }`}
                    >
                      {diff > 0 ? (
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      ) : diff < 0 ? (
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                        </svg>
                      )}
                      {diff === 0 ? "stable" : `${Math.abs(pct)}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "neutral" | "success" | "warning";
}) {
  const styles = {
    neutral: "bg-white border-border text-foreground",
    success: "bg-green-50 border-green-200 text-success",
    warning: "bg-orange-50 border-orange-200 text-warning",
  };

  return (
    <div className={`rounded-xl border px-3 py-3 sm:p-4 ${styles[color]}`}>
      <p className="text-xl sm:text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5 truncate leading-tight">{label}</p>
    </div>
  );
}
