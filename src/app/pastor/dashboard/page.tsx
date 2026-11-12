import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCurrentPeriod } from "@/lib/period";
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
  const reports =
    churchIds.length > 0
      ? await db.weeklyReport.findMany({
          where: { churchId: { in: churchIds }, weekStart },
          select: { id: true, churchId: true, status: true },
        })
      : [];

  const reportByChurch = new Map(reports.map((r) => [r.churchId.toString(), r]));

  const submittedCount = reports.filter((r) => r.status === "SUBMITTED").length;
  const draftCount = reports.filter((r) => r.status === "DRAFT").length;
  const pendingCount = assignments.length - reports.length;

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });

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
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard label="Églises" value={assignments.length} color="neutral" />
          <StatCard label="Soumis" value={submittedCount} color="success" />
          <StatCard
            label={pendingCount + draftCount > 0 ? "En attente" : "Complet"}
            value={pendingCount + draftCount}
            color={pendingCount + draftCount > 0 ? "warning" : "success"}
          />
        </div>
      )}

      {/* Liste des rapports */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">
          Rapports de cette semaine
        </h2>
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
    <div className={`rounded-xl border p-4 ${styles[color]}`}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
