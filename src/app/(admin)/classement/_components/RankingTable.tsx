"use client";

import DiffBadge from "@/components/ui/DiffBadge";

export type ChurchRank = {
  churchId: string;
  name: string;
  rank: number;
  totalAttendance: number;
  avgAttendance: number;
  totalNewcomers: number;
  totalDecisions: number;
  submittedWeeks: number;
  consistencyPct: number;
  trend: number | null; // % vs période précédente, null si pas de données précédentes
  newcomersDiff: number | null;
  decisionsDiff: number | null;
  sortValue: number;
};

type SortKey = "attendance" | "avg" | "newcomers" | "decisions" | "consistency";

const SORT_LABEL: Record<SortKey, string> = {
  attendance: "Présences totales",
  avg: "Moy./sem.",
  newcomers: "Nouveaux",
  decisions: "Décisions",
  consistency: "Consistance",
};

function TrendBadge({ trend }: { trend: number | null }) {
  if (trend === null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (Math.abs(trend) < 1) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500">
        <span>→</span> stable
      </span>
    );
  }
  if (trend > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
        <span>↑</span> +{trend.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
      <span>↓</span> {trend.toFixed(1)}%
    </span>
  );
}

function MedalBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-sm">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center text-sm">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="w-7 h-7 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center text-sm">
        🥉
      </span>
    );
  return (
    <span className="w-7 h-7 rounded-full bg-neutral-50 border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
      {rank}
    </span>
  );
}

export default function RankingTable({
  ranks,
  sortKey,
  periodWeeks,
}: {
  ranks: ChurchRank[];
  sortKey: SortKey;
  periodWeeks: number;
}) {
  if (ranks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground">
        Aucun rapport soumis sur cette période.
      </div>
    );
  }

  const maxVal = ranks[0]?.sortValue ?? 1;

  return (
    <div className="bg-white rounded-xl border border-border overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="border-b border-border bg-neutral-50">
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-12">#</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Église</th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
              Prés. totales
            </th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
              Moy./sem.
            </th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Nouveaux</th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Décisions</th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
              Consistance
            </th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
              Tendance
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ranks.map((r) => {
            const barPct = maxVal > 0 ? (r.sortValue / maxVal) * 100 : 0;
            return (
              <tr key={r.churchId} className="hover:bg-neutral-50/60 transition-colors">
                <td className="px-4 py-3.5">
                  <MedalBadge rank={r.rank} />
                </td>
                <td className="px-4 py-3.5">
                  <div>
                    <p className="font-semibold text-foreground">{r.name}</p>
                    {/* Mini barre de progression basée sur le critère actif */}
                    <div className="mt-1.5 h-1 w-28 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className={`px-4 py-3.5 text-right tabular-nums ${sortKey === "attendance" ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                  {r.totalAttendance.toLocaleString("fr-FR")}
                </td>
                <td className={`px-4 py-3.5 text-right tabular-nums ${sortKey === "avg" ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                  {r.avgAttendance.toLocaleString("fr-FR")}
                </td>
                <td className={`px-4 py-3.5 text-right ${sortKey === "newcomers" ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="tabular-nums">{r.totalNewcomers.toLocaleString("fr-FR")}</span>
                    <DiffBadge diff={r.newcomersDiff} />
                  </div>
                </td>
                <td className={`px-4 py-3.5 text-right ${sortKey === "decisions" ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="tabular-nums">{r.totalDecisions.toLocaleString("fr-FR")}</span>
                    <DiffBadge diff={r.decisionsDiff} />
                  </div>
                </td>
                <td className={`px-4 py-3.5 text-right ${sortKey === "consistency" ? "font-bold" : ""}`}>
                  <div className="flex items-center justify-end gap-2">
                    <span className={
                      r.consistencyPct >= 80 ? "text-success font-semibold" :
                      r.consistencyPct >= 50 ? "text-warning font-semibold" :
                      "text-danger font-semibold"
                    }>
                      {r.consistencyPct}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.submittedWeeks}/{periodWeeks}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <TrendBadge trend={r.trend} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
