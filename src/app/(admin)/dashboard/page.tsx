import { db } from "@/lib/db";
import { getCurrentPeriod } from "@/lib/period";
import Link from "next/link";

export const metadata = { title: "Tableau de bord — ChurchTrack" };

export default async function DashboardPage() {
  const { weekStart, weekEnd } = getCurrentPeriod();

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const [churches, pastorCount, currentReports, prevReports, recentSubmissions, config] =
    await Promise.all([
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
      db.user.count({ where: { role: "PASTOR", isActive: true } }),
      db.weeklyReport.findMany({
        where: { weekStart },
        select: { churchId: true, status: true, attendance: true, submittedAt: true },
      }),
      db.weeklyReport.findMany({
        where: { weekStart: prevWeekStart, status: "SUBMITTED" },
        select: { churchId: true, attendance: true },
      }),
      db.weeklyReport.findMany({
        where: { weekStart, status: "SUBMITTED" },
        orderBy: { submittedAt: "desc" },
        take: 6,
        include: {
          church: { select: { name: true } },
          submittedBy: { select: { fullName: true } },
        },
      }),
      db.appConfig.findUnique({ where: { id: 1 } }),
    ]);

  const windowDays = config?.submissionWindowDays ?? 6;
  const closeDate = new Date(weekStart);
  closeDate.setDate(closeDate.getDate() + windowDays);
  closeDate.setHours(23, 59, 59, 999);
  const periodOpen = new Date() <= closeDate;

  const totalChurches = churches.length;
  const reportMap = new Map(currentReports.map((r) => [r.churchId.toString(), r]));
  const prevReportMap = new Map(prevReports.map((r) => [r.churchId.toString(), r]));

  const submittedCount = currentReports.filter((r) => r.status === "SUBMITTED").length;
  const draftCount = currentReports.filter((r) => r.status === "DRAFT").length;
  const submissionRate = totalChurches > 0 ? Math.round((submittedCount / totalChurches) * 100) : 0;
  const prevRate = totalChurches > 0 ? Math.round((prevReports.length / totalChurches) * 100) : 0;

  const totalAttendance = currentReports
    .filter((r) => r.status === "SUBMITTED")
    .reduce((s, r) => s + r.attendance, 0);
  const prevAttendance = prevReports.reduce((s, r) => s + r.attendance, 0);
  const attendanceDiff = prevReports.length > 0 ? totalAttendance - prevAttendance : null;

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
  const fmtClose = closeDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Semaine du <span className="font-medium text-foreground">{fmtDate(weekStart)}</span>
            {" "}au <span className="font-medium text-foreground">{fmtDate(weekEnd)}</span>
          </p>
        </div>
        <PeriodBadge isOpen={periodOpen} closeLabel={fmtClose} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Églises actives"
          value={totalChurches}
          sub={`${pastorCount} pasteur${pastorCount > 1 ? "s" : ""}`}
          href="/churches"
          color="neutral"
        />
        <StatCard
          label="Soumis cette semaine"
          value={`${submittedCount}/${totalChurches}`}
          sub={draftCount > 0 ? `${draftCount} en brouillon` : "Aucun brouillon"}
          color={submittedCount === totalChurches ? "success" : "neutral"}
        />
        <StatCard
          label="Taux de soumission"
          value={`${submissionRate}%`}
          sub={prevRate > 0 ? `${prevRate}% sem. précédente` : "Première semaine"}
          color={submissionRate >= 80 ? "success" : submissionRate >= 50 ? "warning" : "danger"}
          progress={submissionRate}
        />
        <StatCard
          label="Présences totales"
          value={totalAttendance.toLocaleString("fr-FR")}
          sub={
            attendanceDiff !== null
              ? attendanceDiff >= 0
                ? `↑ +${attendanceDiff} vs sem. passée`
                : `↓ ${attendanceDiff} vs sem. passée`
              : "Aucune donnée précédente"
          }
          color={attendanceDiff === null ? "neutral" : attendanceDiff >= 0 ? "success" : "warning"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Submission status table */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">
              Statut des rapports
            </h2>
            <Link href="/churches" className="text-xs text-primary hover:underline">
              Gérer les églises →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {churches.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Aucune église active.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-neutral-50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Église</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Pasteur principal</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Statut</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Présences</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {churches.map((church) => {
                    const report = reportMap.get(church.id.toString());
                    const primaryPastor = church.pastors[0]?.pastor?.fullName;
                    return (
                      <tr key={church.id.toString()} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-foreground">{church.name}</td>
                        <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">
                          {primaryPastor ?? <span className="text-neutral-300">Non affecté</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <ReportStatusBadge status={report?.status ?? null} />
                        </td>
                        <td className="px-4 py-3.5 text-right text-muted-foreground tabular-nums hidden sm:table-cell">
                          {report?.status === "SUBMITTED"
                            ? report.attendance.toLocaleString("fr-FR")
                            : <span className="text-neutral-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent submissions */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Dernières soumissions
          </h2>
          <div className="bg-white rounded-xl border border-border">
            {recentSubmissions.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Aucune soumission cette semaine.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentSubmissions.map((r) => {
                  const ago = r.submittedAt
                    ? timeAgo(r.submittedAt)
                    : null;
                  return (
                    <div key={r.id.toString()} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.church.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.submittedBy?.fullName ?? "—"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-foreground tabular-nums">
                            {r.attendance.toLocaleString("fr-FR")}
                          </p>
                          <p className="text-xs text-muted-foreground">{ago}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Previous week comparison */}
          {prevReports.length > 0 && (
            <div className="mt-4 bg-white rounded-xl border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Semaine précédente
              </p>
              <p className="text-sm text-foreground">
                <span className="font-bold">{prevReports.length}</span>/{totalChurches} rapports soumis
              </p>
              <p className="text-xs text-muted-foreground">
                {prevAttendance.toLocaleString("fr-FR")} présences totales
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PeriodBadge({ isOpen, closeLabel }: { isOpen: boolean; closeLabel: string }) {
  if (isOpen) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2 text-xs">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="font-semibold text-success">Période ouverte</span>
        <span className="text-green-700">· ferme le {closeLabel}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 px-3.5 py-2 text-xs">
      <span className="h-2 w-2 rounded-full bg-neutral-400" />
      <span className="font-semibold text-muted-foreground">Période fermée</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
  color,
  progress,
}: {
  label: string;
  value: string | number;
  sub: string;
  href?: string;
  color: "neutral" | "success" | "warning" | "danger";
  progress?: number;
}) {
  const colorMap = {
    neutral: { card: "bg-white border-border", value: "text-foreground", sub: "text-muted-foreground", bar: "bg-primary" },
    success: { card: "bg-green-50 border-green-200", value: "text-success", sub: "text-green-700", bar: "bg-success" },
    warning: { card: "bg-orange-50 border-orange-200", value: "text-warning", sub: "text-orange-700", bar: "bg-warning" },
    danger: { card: "bg-red-50 border-red-200", value: "text-danger", sub: "text-red-700", bar: "bg-danger" },
  };
  const c = colorMap[color];
  const inner = (
    <>
      <p className={`text-2xl font-bold tabular-nums ${c.value}`}>{value}</p>
      <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">{label}</p>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${c.bar}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
      <p className={`text-xs mt-1 ${c.sub}`}>{sub}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`block rounded-xl border p-4 hover:shadow-sm transition-shadow ${c.card}`}>
        {inner}
      </Link>
    );
  }
  return <div className={`rounded-xl border p-4 ${c.card}`}>{inner}</div>;
}

function ReportStatusBadge({ status }: { status: string | null }) {
  if (status === "SUBMITTED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Soumis
      </span>
    );
  }
  if (status === "DRAFT") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Brouillon
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
      Non commencé
    </span>
  );
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}
