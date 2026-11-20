"use client";

import { useState } from "react";

type Report = {
  id: string;
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
};

type ChurchStat = {
  name: string;
  count: number;
  totalAttendance: number;
  avgAttendance: number;
  totalNewcomers: number;
};

type Props = {
  reports: Report[];
  churchStats: ChurchStat[];
  periodLabel: string;
};

const HEADERS = [
  "Semaine",
  "Église",
  "Présences",
  "Nouveaux",
  "Décisions",
  "Int. Église",
  "Int. Tribus",
  "Serviteurs",
  "Statut",
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtWeekRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const e = new Date(end).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `${s} – ${e}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function buildRows(reports: Report[]) {
  return reports.map((r) => [
    fmtWeekRange(r.weekStart, r.weekEnd),
    r.churchName,
    r.attendance,
    r.newcomers,
    r.salvationDecisions,
    r.churchIntegration,
    r.tribeIntegration,
    r.servants,
    r.status === "SUBMITTED" ? "Soumis" : "Brouillon",
  ]);
}

export default function ExportButtons({ reports, churchStats, periodLabel }: Props) {
  const [loadingXlsx, setLoadingXlsx] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  /* ---- Export Excel ---- */
  async function exportExcel() {
    setLoadingXlsx(true);
    try {
      const { utils, writeFile } = await import("xlsx");
      const wb = utils.book_new();

      // Feuille 1 : données détaillées
      const ws1 = utils.aoa_to_sheet([HEADERS, ...buildRows(reports)]);
      ws1["!cols"] = [16, 20, 11, 11, 11, 11, 11, 11, 11].map((w) => ({ wch: w }));
      utils.book_append_sheet(wb, ws1, "Rapports");

      // Feuille 2 : synthèse par église
      const ws2 = utils.aoa_to_sheet([
        ["Église", "Rapports soumis", "Total présences", "Moy. présences", "Total nouveaux"],
        ...churchStats.map((c) => [c.name, c.count, c.totalAttendance, c.avgAttendance, c.totalNewcomers]),
      ]);
      ws2["!cols"] = [22, 16, 16, 16, 16].map((w) => ({ wch: w }));
      utils.book_append_sheet(wb, ws2, "Synthèse par église");

      writeFile(wb, `churchtrack-rapports-${todayStr()}.xlsx`);
    } finally {
      setLoadingXlsx(false);
    }
  }

  /* ---- Export PDF ---- */
  async function exportPdf() {
    setLoadingPdf(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const today = fmtDate(new Date().toISOString());

      // En-tête
      doc.setFontSize(18);
      doc.setTextColor(22, 128, 102); // couleur primaire approximée
      doc.text("ChurchTrack", 14, 16);
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`Rapports hebdomadaires — ${periodLabel}`, 14, 23);
      doc.setFontSize(9);
      doc.setTextColor(140, 140, 140);
      doc.text(`Exporté le ${today}`, pageW - 14, 16, { align: "right" });

      // Cartes de synthèse (ligne de chiffres clés)
      if (churchStats.length > 0) {
        const totalAttendance = churchStats.reduce((s, c) => s + c.totalAttendance, 0);
        const totalNewcomers = churchStats.reduce((s, c) => s + c.totalNewcomers, 0);
        const submittedCount = reports.filter((r) => r.status === "SUBMITTED").length;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const summary = `${submittedCount} rapports soumis  ·  ${totalAttendance.toLocaleString("fr-FR")} présences totales  ·  ${totalNewcomers.toLocaleString("fr-FR")} nouveaux`;
        doc.text(summary, 14, 30);
      }

      // Tableau principal
      autoTable(doc, {
        startY: 35,
        head: [HEADERS],
        body: buildRows(reports),
        headStyles: {
          fillColor: [22, 128, 102],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
        },
        bodyStyles: { fontSize: 8.5, textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [248, 250, 250] },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 38 },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right" },
          7: { halign: "right" },
          8: { cellWidth: 20 },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Numéro de page en pied
          const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(160);
          doc.text(
            `Page ${data.pageNumber} / ${pageCount}`,
            pageW / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: "center" }
          );
        },
      });

      // Synthèse par église — nouvelle page si plusieurs églises
      if (churchStats.length > 1) {
        doc.addPage();
        doc.setFontSize(13);
        doc.setTextColor(22, 128, 102);
        doc.text("Synthèse par église", 14, 16);

        autoTable(doc, {
          startY: 22,
          head: [["Église", "Rapports soumis", "Total présences", "Moy. présences/sem.", "Total nouveaux"]],
          body: churchStats.map((c) => [
            c.name,
            c.count,
            c.totalAttendance.toLocaleString("fr-FR"),
            c.avgAttendance.toLocaleString("fr-FR"),
            c.totalNewcomers.toLocaleString("fr-FR"),
          ]),
          headStyles: { fillColor: [22, 128, 102], textColor: 255, fontStyle: "bold", fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          alternateRowStyles: { fillColor: [248, 250, 250] },
          columnStyles: {
            1: { halign: "right" },
            2: { halign: "right" },
            3: { halign: "right" },
            4: { halign: "right" },
          },
          margin: { left: 14, right: 14 },
        });
      }

      doc.save(`churchtrack-rapports-${todayStr()}.pdf`);
    } finally {
      setLoadingPdf(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportExcel}
        disabled={loadingXlsx || reports.length === 0}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-medium text-foreground hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loadingXlsx ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-primary" />
        ) : (
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        Excel
      </button>

      <button
        onClick={exportPdf}
        disabled={loadingPdf || reports.length === 0}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-medium text-foreground hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loadingPdf ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-primary" />
        ) : (
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
        PDF
      </button>
    </div>
  );
}
