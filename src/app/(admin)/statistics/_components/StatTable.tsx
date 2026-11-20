"use client";

type Report = {
  id: string;
  churchId: string;
  churchName: string;
  weekStart: string;
  weekEnd: string;
  attendance: number;
  newcomers: number;
  salvationDecisions: number;
  churchIntegration: number;
  tribeIntegration: number;
  servants: number;
  status: string;
  submittedAt: string | null;
};

type ChurchStat = {
  churchId: string;
  name: string;
  count: number;
  totalAttendance: number;
  avgAttendance: number;
  totalNewcomers: number;
};

const COLUMNS = [
  { key: "attendance", label: "Présences" },
  { key: "newcomers", label: "Nouveaux" },
  { key: "salvationDecisions", label: "Décisions" },
  { key: "churchIntegration", label: "Int. Église" },
  { key: "tribeIntegration", label: "Int. Tribus" },
  { key: "servants", label: "Serviteurs" },
] as const;

type ColKey = (typeof COLUMNS)[number]["key"];

export default function StatTable({
  reports,
  churchStats,
}: {
  reports: Report[];
  churchStats: ChurchStat[];
}) {
  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground">
        Aucun rapport pour les filtres sélectionnés.
      </div>
    );
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  const submitted = reports.filter((r) => r.status === "SUBMITTED");
  const totals = COLUMNS.reduce(
    (acc, col) => {
      acc[col.key] = submitted.reduce((s, r) => s + r[col.key], 0);
      return acc;
    },
    {} as Record<ColKey, number>
  );

  return (
    <div className="space-y-6">
      {/* Detailed table */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Détail des rapports
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({reports.length} rapport{reports.length > 1 ? "s" : ""})
          </span>
        </h2>
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
                  Semaine
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Église
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="text-right px-3 py-3 font-semibold text-muted-foreground whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.map((r) => {
                const isSubmitted = r.status === "SUBMITTED";
                return (
                  <tr key={r.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums text-xs">
                      {fmtDate(r.weekStart)} – {fmtDate(r.weekEnd)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{r.churchName}</td>
                    {COLUMNS.map((col) => (
                      <td key={col.key} className="px-3 py-3 text-right tabular-nums">
                        {isSubmitted ? (
                          <span className="text-foreground">
                            {r[col.key].toLocaleString("fr-FR")}
                          </span>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      {isSubmitted ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          Soumis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          Brouillon
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Totals row */}
              {submitted.length > 0 && (
                <tr className="bg-neutral-50 border-t-2 border-border">
                  <td
                    className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide"
                    colSpan={2}
                  >
                    Total ({submitted.length} soumis)
                  </td>
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className="px-3 py-3 text-right tabular-nums font-bold text-foreground"
                    >
                      {totals[col.key].toLocaleString("fr-FR")}
                    </td>
                  ))}
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-church ranking — only when multiple churches */}
      {churchStats.length > 1 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Classement par église
          </h2>
          <div className="bg-white rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-neutral-50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Église
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    Rapports
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    Total présences
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    Moy. présences
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    Total nouveaux
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground pr-6">
                    Jauge
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {churchStats.map((cs, i) => {
                  const maxAttendance = churchStats[0].totalAttendance;
                  const pct =
                    maxAttendance > 0
                      ? Math.round((cs.totalAttendance / maxAttendance) * 100)
                      : 0;
                  return (
                    <tr key={cs.churchId} className="hover:bg-neutral-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              i === 0
                                ? "bg-amber-100 text-amber-700"
                                : i === 1
                                ? "bg-neutral-200 text-neutral-600"
                                : i === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="font-medium text-foreground">{cs.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {cs.count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">
                        {cs.totalAttendance.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {cs.avgAttendance.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {cs.totalNewcomers.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 pr-6">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-24 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
