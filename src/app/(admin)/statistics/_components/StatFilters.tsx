"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

type Church = { id: string; name: string };

const WEEK_OPTIONS = [
  { label: "4 sem.", value: "4" },
  { label: "8 sem.", value: "8" },
  { label: "13 sem.", value: "13" },
  { label: "Tout", value: "all" },
];

const STATUS_OPTIONS = [
  { label: "Soumis", value: "submitted" },
  { label: "Tous", value: "all" },
];

export default function StatFilters({
  churches,
  currentChurch,
  currentWeeks,
  currentStatus,
}: {
  churches: Church[];
  currentChurch: string;
  currentWeeks: string;
  currentStatus: string;
}) {
  const router = useRouter();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams({
        church: currentChurch,
        weeks: currentWeeks,
        status: currentStatus,
        [key]: value,
      });
      router.push(`/statistics?${params.toString()}`);
    },
    [router, currentChurch, currentWeeks, currentStatus]
  );

  return (
    <div className="rounded-xl border border-border bg-white p-4 flex flex-wrap items-center gap-x-5 gap-y-3">
      {/* Church */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
          Église
        </label>
        <select
          value={currentChurch}
          onChange={(e) => update("church", e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Toutes les églises</option>
          {churches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden sm:block h-5 w-px bg-border" />

      {/* Period */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
          Période
        </span>
        <div className="flex gap-1 p-0.5 rounded-lg bg-neutral-100">
          {WEEK_OPTIONS.map((opt) => (
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

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
          Statut
        </span>
        <div className="flex gap-1 p-0.5 rounded-lg bg-neutral-100">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update("status", opt.value)}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                currentStatus === opt.value
                  ? "bg-white text-foreground shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
