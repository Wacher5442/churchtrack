"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

const PERIOD_OPTIONS = [
  { label: "4 sem.", value: "4" },
  { label: "8 sem.", value: "8" },
  { label: "13 sem.", value: "13" },
];

const SORT_OPTIONS = [
  { label: "Présences totales", value: "attendance" },
  { label: "Moy. présences", value: "avg" },
  { label: "Nouveaux", value: "newcomers" },
  { label: "Décisions", value: "decisions" },
  { label: "Consistance", value: "consistency" },
];

export default function ClassementFilters({
  currentWeeks,
  currentSort,
}: {
  currentWeeks: string;
  currentSort: string;
}) {
  const router = useRouter();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams({
        weeks: currentWeeks,
        sort: currentSort,
        [key]: value,
      });
      router.push(`/classement?${params.toString()}`);
    },
    [router, currentWeeks, currentSort]
  );

  return (
    <div className="rounded-xl border border-border bg-white p-4 flex flex-wrap items-center gap-x-5 gap-y-3">
      {/* Période */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
          Période
        </span>
        <div className="flex gap-1 p-0.5 rounded-lg bg-neutral-100">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update("weeks", opt.value)}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                currentWeeks === opt.value
                  ? "bg-white text-foreground shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden sm:block h-5 w-px bg-border" />

      {/* Critère de classement */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
          Classer par
        </span>
        <select
          value={currentSort}
          onChange={(e) => update("sort", e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
