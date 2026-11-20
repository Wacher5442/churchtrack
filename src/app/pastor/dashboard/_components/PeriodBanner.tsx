"use client";

import { useState } from "react";

type Props = {
  isOpen: boolean;
  closeDate: string;
  windowDays: number;
};

export default function PeriodBanner({ isOpen, closeDate }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const close = new Date(closeDate);
  const closeLabel = close.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (isOpen) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-success">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-success">Période de saisie ouverte</p>
          <p className="text-xs text-green-700">
            Vous pouvez soumettre vos rapports jusqu'au {closeLabel}.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded-md text-green-600 hover:bg-green-100 transition-colors"
          aria-label="Fermer"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-muted-foreground">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">Période de saisie fermée</p>
        <p className="text-xs text-muted-foreground">
          La fenêtre de soumission s'est fermée le {closeLabel}.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 rounded-md text-muted-foreground hover:bg-neutral-200 transition-colors"
        aria-label="Fermer"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
