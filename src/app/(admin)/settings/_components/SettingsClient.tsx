"use client";

import { useState } from "react";

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAY_NAMES_FULL = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function getClosingLabel(days: number): string {
  const dayName = DAY_NAMES_FULL[days % 7];
  if (days <= 6) return `${dayName} (semaine courante)`;
  return `${dayName} (semaine suivante)`;
}

type Props = {
  initialValue: number;
  updatedAt: string | null;
  updatedBy: string | null;
};

export default function SettingsClient({ initialValue, updatedAt, updatedBy }: Props) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(updatedAt);
  const [lastUpdatedBy, setLastUpdatedBy] = useState(updatedBy);

  const isDirty = value !== saved;

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionWindowDays: value }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    setSaved(value);
    setLastUpdatedAt(data.updatedAt);
    setLastUpdatedBy(data.updatedBy);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Fenêtre de saisie */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Fenêtre de saisie</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Nombre de jours après le dimanche durant lesquels les pasteurs peuvent soumettre leur rapport hebdomadaire.
            </p>
          </div>
        </div>

        {/* Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">
              Durée de la fenêtre
            </label>
            <span className="text-2xl font-bold text-primary tabular-nums">
              {value} <span className="text-base font-medium text-muted-foreground">jour{value > 1 ? "s" : ""}</span>
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={13}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-neutral-200"
          />

          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>1 jour</span>
            <span>13 jours</span>
          </div>
        </div>

        {/* Visual timeline */}
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Aperçu de la période</p>
          <div className="space-y-2">
            {/* Semaine 1 */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Semaine courante</p>
              <div className="flex gap-1">
                {DAYS.map((day, i) => {
                  const dayIndex = i; // 0=Sunday, 6=Saturday
                  const isOpen = dayIndex <= value;
                  const isStart = dayIndex === 0;
                  const isEnd = dayIndex === value && value <= 6;
                  return (
                    <div
                      key={day}
                      className={`flex-1 rounded-lg py-2 text-center transition-colors ${
                        isStart
                          ? "bg-primary text-white"
                          : isOpen
                          ? isEnd
                            ? "bg-primary/80 text-white"
                            : "bg-primary-subtle text-primary border border-primary/20"
                          : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      <span className="text-xs font-medium block">{day}</span>
                      {isStart && <span className="text-[9px] opacity-80">Début</span>}
                      {isEnd && <span className="text-[9px] opacity-80">Fin</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Semaine 2 — visible si value > 6 */}
            {value > 6 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Semaine suivante</p>
                <div className="flex gap-1">
                  {DAYS.map((day, i) => {
                    const dayIndex = i + 7;
                    const isOpen = dayIndex <= value;
                    const isEnd = dayIndex === value;
                    return (
                      <div
                        key={day}
                        className={`flex-1 rounded-lg py-2 text-center transition-colors ${
                          isOpen
                            ? isEnd
                              ? "bg-primary/80 text-white"
                              : "bg-primary-subtle text-primary border border-primary/20"
                            : "bg-neutral-100 text-neutral-400"
                        }`}
                      >
                        <span className="text-xs font-medium block">{day}</span>
                        {isEnd && <span className="text-[9px] opacity-80">Fin</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg bg-neutral-50 border border-border px-4 py-3 mb-6 flex items-center gap-3">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-muted-foreground shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-muted-foreground">
            Les rapports peuvent être soumis du <span className="font-medium text-foreground">dimanche</span> au{" "}
            <span className="font-medium text-foreground">{getClosingLabel(value)}</span>.
          </p>
        </div>

        {/* Error / success */}
        {error && (
          <p className="mb-4 text-sm text-danger bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
            {error}
          </p>
        )}
        {success && (
          <p className="mb-4 text-sm text-success bg-green-50 border border-green-100 rounded-lg px-3.5 py-2.5 flex items-center gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Paramètre enregistré.
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          {lastUpdatedAt && (
            <p className="text-xs text-muted-foreground">
              Modifié le{" "}
              {new Date(lastUpdatedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {lastUpdatedBy && <> par <span className="font-medium">{lastUpdatedBy}</span></>}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={loading || !isDirty}
            className="ml-auto h-10 px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {loading ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
