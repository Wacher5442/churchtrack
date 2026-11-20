"use client";

import { Fragment, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DiffBadge from "@/components/ui/DiffBadge";

export type ReportRow = {
  churchId: string;
  churchName: string;
  primaryPastor: string | null;
  report: {
    id: string;
    attendance: number;
    newcomers: number;
    salvationDecisions: number;
    churchIntegration: number;
    tribeIntegration: number;
    servants: number;
    status: string;
    submittedAt: string | null;
    submittedByName: string | null;
    isUnlocked: boolean;
  } | null;
};

type Week = { label: string; value: string };

type PrevValues = {
  attendance: number; newcomers: number; salvationDecisions: number;
  churchIntegration: number; tribeIntegration: number; servants: number;
};

const INDICATORS = [
  { key: "attendance", label: "Présences" },
  { key: "newcomers", label: "Nouveaux" },
  { key: "salvationDecisions", label: "Décisions" },
  { key: "churchIntegration", label: "Int. Église" },
  { key: "tribeIntegration", label: "Int. Tribus" },
  { key: "servants", label: "Serviteurs" },
] as const;

function StatusBadge({ status, isUnlocked }: { status: string | null; isUnlocked?: boolean }) {
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
  if (isUnlocked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Débloqué
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

export default function ReportsClient({
  rows,
  selectedWeek,
  periodOpen,
  availableWeeks,
  submittedCount,
  totalCount,
  prevReportMap = {},
}: {
  rows: ReportRow[];
  selectedWeek: string;
  periodOpen: boolean;
  availableWeeks: Week[];
  submittedCount: number;
  totalCount: number;
  prevReportMap?: Record<string, PrevValues>;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const currentIdx = availableWeeks.findIndex((w) => w.value === selectedWeek);
  const hasPrev = currentIdx < availableWeeks.length - 1;
  const hasNext = currentIdx > 0;

  const navigate = useCallback(
    (weekValue: string) => router.push(`/reports?week=${weekValue}`),
    [router]
  );

  function toggleExpand(churchId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(churchId)) next.delete(churchId);
      else next.add(churchId);
      return next;
    });
  }

  async function handleDelete(reportId: string) {
    setDeleting(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmDelete(null);
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  }

  async function handleUnlock(churchId: string) {
    setUnlocking(churchId);
    try {
      const res = await fetch("/api/admin/reports/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ churchId, weekStart: selectedWeek }),
      });
      if (res.ok) router.refresh();
    } finally {
      setUnlocking(null);
    }
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div>
      {/* Navigation semaine */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => hasPrev && navigate(availableWeeks[currentIdx + 1].value)}
            disabled={!hasPrev}
            className="p-2 rounded-lg border border-border bg-white text-muted-foreground hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Semaine précédente"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <select
            value={selectedWeek}
            onChange={(e) => navigate(e.target.value)}
            className="flex-1 min-w-0 text-sm font-semibold border border-border rounded-lg px-3 py-2 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {availableWeeks.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => hasNext && navigate(availableWeeks[currentIdx - 1].value)}
            disabled={!hasNext}
            className="p-2 rounded-lg border border-border bg-white text-muted-foreground hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Semaine suivante"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{submittedCount}</span>/{totalCount} soumis
          </span>
          {periodOpen ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Période ouverte
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-semibold text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              Période fermée
            </span>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-xl border border-border overflow-hidden">
        {rows.length === 0 ? (
          <div className="bg-white p-10 text-center text-sm text-muted-foreground">
            Aucune église active.
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full bg-white text-sm min-w-[750px]">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Église</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Pasteur principal
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Statut</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                  Présences
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Soumis par
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isExpanded = expanded.has(row.churchId);
                const r = row.report;
                const canDelete = r?.status === "DRAFT";
                const canUnlock = !periodOpen && r?.status !== "SUBMITTED";
                const isConfirming = confirmDelete === r?.id;

                return (
                  <Fragment key={row.churchId}>
                    <tr
                      className="border-t border-border hover:bg-neutral-50/60 transition-colors"
                    >
                      {/* Expand toggle */}
                      <td className="px-4 py-3.5">
                        {r && r.status === "SUBMITTED" ? (
                          <button
                            onClick={() => toggleExpand(row.churchId)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Voir le détail"
                          >
                            <svg
                              width="14"
                              height="14"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : (
                          <span className="w-6 h-6 block" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-foreground">{row.churchName}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {row.primaryPastor ?? (
                          <span className="text-neutral-300">Non affecté</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge
                          status={r?.status ?? null}
                          isUnlocked={r?.isUnlocked ?? false}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {r?.status === "SUBMITTED" ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-semibold text-foreground tabular-nums">
                              {r.attendance.toLocaleString("fr-FR")}
                            </span>
                            <DiffBadge
                              diff={prevReportMap[row.churchId] != null
                                ? r.attendance - prevReportMap[row.churchId].attendance
                                : null}
                            />
                          </div>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {r?.status === "SUBMITTED" ? (
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {r.submittedByName ?? "—"}
                            </p>
                            {r.submittedAt && (
                              <p className="text-xs text-muted-foreground">
                                {fmtDate(r.submittedAt)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canDelete && !isConfirming && (
                            <button
                              onClick={() => setConfirmDelete(r!.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-red-100 transition-colors"
                            >
                              Supprimer
                            </button>
                          )}
                          {isConfirming && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-danger font-medium">Confirmer ?</span>
                              <button
                                onClick={() => handleDelete(r!.id)}
                                disabled={deleting === r!.id}
                                className="inline-flex items-center rounded-lg bg-danger px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                              >
                                {deleting === r!.id ? "..." : "Oui"}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="inline-flex items-center rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-neutral-50 transition-colors"
                              >
                                Non
                              </button>
                            </div>
                          )}
                          {canUnlock && (
                            <button
                              onClick={() => handleUnlock(row.churchId)}
                              disabled={unlocking === row.churchId}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60 transition-colors"
                            >
                              {unlocking === row.churchId ? "..." : "Débloquer"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Ligne de détail expandée */}
                    {isExpanded && r && r.status === "SUBMITTED" && (
                      <tr className="border-t border-border bg-neutral-50/40">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {INDICATORS.map((ind) => {
                              const val = r[ind.key as keyof typeof r] as number;
                              const prev = prevReportMap[row.churchId];
                              const diff = prev != null
                                ? val - (prev[ind.key as keyof PrevValues] as number)
                                : null;
                              return (
                                <div
                                  key={ind.key}
                                  className="rounded-lg border border-border bg-white px-3 py-2.5 text-center"
                                >
                                  <p className="text-xs text-muted-foreground mb-1">{ind.label}</p>
                                  <p className="text-xl font-bold text-foreground tabular-nums">
                                    {val.toLocaleString("fr-FR")}
                                  </p>
                                  <div className="mt-0.5 flex justify-center">
                                    <DiffBadge diff={diff} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
