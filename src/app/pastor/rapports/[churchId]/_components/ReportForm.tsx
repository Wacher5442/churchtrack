"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { INDICATOR_LABELS, computeVariation, type IndicatorKey } from "@/lib/variations";

type Report = {
  id: string;
  attendance: number;
  newcomers: number;
  salvationDecisions: number;
  churchIntegration: number;
  tribeIntegration: number;
  servants: number;
  status: "DRAFT" | "SUBMITTED";
  submittedAt: string | null;
  updatedAt: string;
};

type Values = Record<IndicatorKey, number>;

type Props = {
  churchId: string;
  churchName: string;
  location: string;
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  periodOpen: boolean;
  closeDate: string;
  isUnlockedPastWeek?: boolean;
  initialReport: Report | null;
  previousReport: Report | null;
};

const FIELDS: { key: IndicatorKey; icon: React.ReactNode }[] = [
  {
    key: "attendance",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: "newcomers",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    key: "salvationDecisions",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    key: "churchIntegration",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: "tribeIntegration",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    key: "servants",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

function toValues(r: Report | null): Values {
  return {
    attendance: r?.attendance ?? 0,
    newcomers: r?.newcomers ?? 0,
    salvationDecisions: r?.salvationDecisions ?? 0,
    churchIntegration: r?.churchIntegration ?? 0,
    tribeIntegration: r?.tribeIntegration ?? 0,
    servants: r?.servants ?? 0,
  };
}

export default function ReportForm({
  churchId,
  churchName,
  location,
  weekStart,
  weekLabel,
  periodOpen,
  closeDate,
  isUnlockedPastWeek,
  initialReport,
  previousReport,
}: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(toValues(initialReport));
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED" | null>(
    initialReport?.status ?? null
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(initialReport?.updatedAt ?? null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const isReadOnly = status === "SUBMITTED" || !periodOpen;
  const closeLabel = new Date(closeDate).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  function set(key: IndicatorKey, raw: string) {
    const n = parseInt(raw, 10);
    setValues((v) => ({ ...v, [key]: isNaN(n) || n < 0 ? 0 : n }));
  }

  function step(key: IndicatorKey, delta: number) {
    setValues((v) => ({ ...v, [key]: Math.max(0, v[key] + delta) }));
  }

  async function save(action: "draft" | "submit") {
    setError(null);
    if (action === "draft") setSaving(true);
    else setSubmitting(true);

    const res = await fetch(`/api/reports/${churchId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, action, weekStart }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
      setSaving(false);
      setSubmitting(false);
      return;
    }

    if (action === "submit") {
      router.push("/pastor/dashboard?submitted=1");
    } else {
      setStatus("DRAFT");
      setSavedAt(data.updatedAt);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
          <Link href="/pastor/dashboard" className="hover:text-foreground transition-colors">
            Tableau de bord
          </Link>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-foreground font-medium">{churchName}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{churchName}</h1>
            {location && <p className="text-sm text-muted-foreground">{location}</p>}
            <p className="text-sm text-muted-foreground mt-1 leading-snug">{weekLabel}</p>
          </div>
          <StatusBadge status={status} periodOpen={periodOpen} />
        </div>
      </div>

      {/* Bannière semaine débloquée */}
      {isUnlockedPastWeek && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-amber-600 shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-amber-800">
            Cette semaine a été débloquée par l'administrateur. Vous pouvez compléter et soumettre ce rapport.
          </p>
        </div>
      )}

      {/* Period banner */}
      {!periodOpen && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-muted-foreground shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-sm text-muted-foreground">
            Période fermée depuis le {closeLabel}. Consultation uniquement.
          </p>
        </div>
      )}

      {status === "SUBMITTED" && periodOpen && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-success shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-800">
            Rapport soumis avec succès. Aucune modification possible.
          </p>
        </div>
      )}

      {/* Fields */}
      <div className="bg-white rounded-xl border border-border divide-y divide-border mb-5">
        {FIELDS.map(({ key, icon }) => {
          const prev = previousReport?.[key] ?? null;
          const variation = computeVariation(values[key], prev);
          return (
          <div key={key} className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
            {/* Icône masquée sur mobile pour gagner de la place */}
            <span className="hidden sm:block text-muted-foreground shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{INDICATOR_LABELS[key]}</p>
              <VariationChip variation={variation} prevValue={prev} />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => step(key, -1)}
                disabled={isReadOnly || values[key] === 0}
                className="h-9 w-9 sm:h-8 sm:w-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 text-lg leading-none flex items-center justify-center"
              >
                −
              </button>
              <input
                type="number"
                min={0}
                value={values[key]}
                onChange={(e) => set(key, e.target.value)}
                readOnly={isReadOnly}
                className={`w-14 sm:w-16 rounded-lg border text-center text-base font-semibold tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary h-9 ${
                  isReadOnly
                    ? "border-transparent bg-neutral-50 text-foreground cursor-default"
                    : "border-border bg-white text-foreground"
                }`}
              />
              <button
                type="button"
                onClick={() => step(key, 1)}
                disabled={isReadOnly}
                className="h-9 w-9 sm:h-8 sm:w-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 text-lg leading-none flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Draft saved */}
      {savedAt && status === "DRAFT" && (
        <p className="mb-4 text-xs text-muted-foreground text-right">
          Brouillon enregistré le{" "}
          {new Date(savedAt).toLocaleString("fr-FR", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      )}

      {/* Actions */}
      {!isReadOnly && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => save("draft")}
            disabled={saving || submitting}
            className="h-11 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-neutral-50 disabled:opacity-50 transition-colors sm:flex-1"
          >
            {saving ? "Enregistrement…" : "Enregistrer en brouillon"}
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={saving || submitting}
            className="h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors sm:flex-1"
          >
            Soumettre le rapport
          </button>
        </div>
      )}

      {isReadOnly && (
        <Link
          href="/pastor/dashboard"
          className="flex h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-medium text-foreground hover:bg-neutral-50 transition-colors"
        >
          Retour au tableau de bord
        </Link>
      )}

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-foreground mb-2">
              Soumettre le rapport ?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Une fois soumis, le rapport ne pourra plus être modifié. Confirmez-vous les données saisies ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => { setShowConfirm(false); save("submit"); }}
                disabled={submitting}
                className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {submitting ? "Soumission…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VariationChip({
  variation,
  prevValue,
}: {
  variation: ReturnType<typeof computeVariation>;
  prevValue: number | null;
}) {
  if (prevValue === null) return null;

  if (variation.label === "stable") {
    return (
      <p className="text-xs text-muted-foreground mt-0.5">
        = stable · sem. passée : {prevValue}
      </p>
    );
  }

  if (variation.label === "up") {
    return (
      <p className="text-xs text-success mt-0.5 font-medium">
        ↑ +{variation.absolute} · sem. passée : {prevValue}
      </p>
    );
  }

  if (variation.label === "down") {
    return (
      <p className="text-xs text-danger mt-0.5 font-medium">
        ↓ {variation.absolute} · sem. passée : {prevValue}
      </p>
    );
  }

  return null;
}

function StatusBadge({ status, periodOpen }: { status: "DRAFT" | "SUBMITTED" | null; periodOpen: boolean }) {
  if (status === "SUBMITTED") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Soumis
      </span>
    );
  }
  if (status === "DRAFT") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Brouillon
      </span>
    );
  }
  if (!periodOpen) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-medium text-muted-foreground">
        Fermé
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
      Non commencé
    </span>
  );
}
