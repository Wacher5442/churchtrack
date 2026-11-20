"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { useState, useMemo } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

type Report = {
  churchId: string;
  churchName: string;
  weekStart: string;
  attendance: number;
  newcomers: number;
  salvationDecisions: number;
  churchIntegration: number;
  tribeIntegration: number;
  servants: number;
  status: string;
};

type IndicatorKey = keyof Omit<Report, "churchId" | "churchName" | "weekStart" | "status">;

const INDICATORS: { key: IndicatorKey; label: string; short: string }[] = [
  { key: "attendance", label: "Présences aux cultes", short: "Présences" },
  { key: "newcomers", label: "Nouveaux", short: "Nouveaux" },
  { key: "salvationDecisions", label: "Décisions pour Jésus", short: "Décisions" },
  { key: "churchIntegration", label: "Intégrations église", short: "Int. Église" },
  { key: "tribeIntegration", label: "Intégrations tribus", short: "Int. Tribus" },
  { key: "servants", label: "Serviteurs", short: "Serviteurs" },
];

// Palette de couleurs harmonieuse avec la couleur primaire
const PALETTE = [
  { stroke: "hsl(174,62%,35%)", fill: "hsla(174,62%,35%,0.1)" },
  { stroke: "hsl(214,70%,50%)", fill: "hsla(214,70%,50%,0.1)" },
  { stroke: "hsl(340,65%,50%)", fill: "hsla(340,65%,50%,0.1)" },
  { stroke: "hsl(45,85%,45%)", fill: "hsla(45,85%,45%,0.1)" },
  { stroke: "hsl(280,60%,55%)", fill: "hsla(280,60%,55%,0.1)" },
  { stroke: "hsl(15,75%,55%)", fill: "hsla(15,75%,55%,0.1)" },
  { stroke: "hsl(145,55%,40%)", fill: "hsla(145,55%,40%,0.1)" },
  { stroke: "hsl(200,70%,45%)", fill: "hsla(200,70%,45%,0.1)" },
];

function fmtWeek(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function StatCharts({ reports }: { reports: Report[] }) {
  const [activeKey, setActiveKey] = useState<IndicatorKey>("attendance");

  const submitted = useMemo(() => reports.filter((r) => r.status === "SUBMITTED"), [reports]);

  const weeks = useMemo(
    () => [...new Set(submitted.map((r) => r.weekStart))].sort(),
    [submitted]
  );

  const churches = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const r of submitted) {
      if (!seen.has(r.churchId)) {
        seen.add(r.churchId);
        list.push({ id: r.churchId, name: r.churchName });
      }
    }
    return list;
  }, [submitted]);

  // Map churchId → weekStart → valeur
  const dataMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const r of submitted) {
      if (!map.has(r.churchId)) map.set(r.churchId, new Map());
      map.get(r.churchId)!.set(r.weekStart, r[activeKey]);
    }
    return map;
  }, [submitted, activeKey]);

  if (submitted.length === 0) return null;

  const activeLabel = INDICATORS.find((i) => i.key === activeKey)!;
  const multiChurch = churches.length > 1;

  /* ---- Graphique ligne : évolution temporelle ---- */
  const lineData = {
    labels: weeks.map(fmtWeek),
    datasets: churches.map((church, i) => {
      const color = PALETTE[i % PALETTE.length];
      const churchWeekMap = dataMap.get(church.id);
      return {
        label: church.name,
        data: weeks.map((w) => churchWeekMap?.get(w) ?? null),
        borderColor: color.stroke,
        backgroundColor: color.fill,
        pointBackgroundColor: color.stroke,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: !multiChurch,
        tension: 0.35,
        spanGaps: false,
      };
    }),
  };

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: multiChurch,
        position: "bottom",
        labels: { boxWidth: 12, padding: 16, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ` ${ctx.dataset.label} : ${(ctx.parsed.y ?? 0).toLocaleString("fr-FR")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: "#6b7280" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          font: { size: 11 },
          color: "#6b7280",
          callback: (v) => Number(v).toLocaleString("fr-FR"),
        },
      },
    },
  };

  /* ---- Graphique barres : classement des églises ---- */
  const churchTotals = churches
    .map((church) => {
      const m = dataMap.get(church.id);
      const total = m ? [...m.values()].reduce((s, v) => s + v, 0) : 0;
      return { name: church.name, total };
    })
    .sort((a, b) => b.total - a.total);

  const barData = {
    labels: churchTotals.map((c) => c.name),
    datasets: [
      {
        label: activeLabel.short,
        data: churchTotals.map((c) => c.total),
        backgroundColor: churchTotals.map((_, i) => PALETTE[i % PALETTE.length].stroke),
        borderRadius: 6,
        borderSkipped: false as const,
      },
    ],
  };

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${(ctx.parsed.x ?? 0).toLocaleString("fr-FR")}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          font: { size: 11 },
          color: "#6b7280",
          callback: (v) => Number(v).toLocaleString("fr-FR"),
        },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: "#374151" },
      },
    },
  };

  const barHeight = Math.max(180, churches.length * 48);

  return (
    <div className="mb-6 space-y-4">
      {/* Sélecteur d'indicateur */}
      <div className="flex flex-wrap gap-1.5">
        {INDICATORS.map((ind) => (
          <button
            key={ind.key}
            onClick={() => setActiveKey(ind.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              activeKey === ind.key
                ? "bg-primary text-white"
                : "bg-white border border-border text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {ind.short}
          </button>
        ))}
      </div>

      <div className={`grid gap-4 ${multiChurch ? "lg:grid-cols-2" : ""}`}>
        {/* Ligne : évolution temporelle */}
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-sm font-semibold text-foreground mb-1">
            Évolution — {activeLabel.label}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {weeks.length} semaine{weeks.length > 1 ? "s" : ""} analysée{weeks.length > 1 ? "s" : ""}
          </p>
          <div className="h-56">
            {weeks.length < 2 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Pas assez de données pour afficher l'évolution.
              </div>
            ) : (
              <Line data={lineData} options={lineOptions} />
            )}
          </div>
        </div>

        {/* Barres horizontales : comparaison par église */}
        {multiChurch && (
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-sm font-semibold text-foreground mb-1">
              Classement — Total {activeLabel.short}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {churches.length} église{churches.length > 1 ? "s" : ""} sur la période
            </p>
            <div style={{ height: barHeight }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
