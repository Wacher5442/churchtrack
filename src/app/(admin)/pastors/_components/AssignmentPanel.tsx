"use client";

import { useState, useEffect, useCallback } from "react";

type Assignment = {
  churchId: string;
  churchName: string;
  location: string;
  churchIsActive: boolean;
  isPrimary: boolean;
};

type Church = {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
};

type Pastor = { id: string; fullName: string };

type Props = {
  pastor: Pastor;
  onClose: () => void;
  onChanged: () => void;
};

export default function AssignmentPanel({ pastor, onClose, onChanged }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allChurches, setAllChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [addChurchId, setAddChurchId] = useState("");
  const [addIsPrimary, setAddIsPrimary] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [assignRes, churchRes] = await Promise.all([
      fetch(`/api/pastors/${pastor.id}/churches`),
      fetch("/api/churches"),
    ]);

    if (assignRes.ok) {
      setAssignments(await assignRes.json());
    }

    if (churchRes.ok) {
      const raw = await churchRes.json();
      setAllChurches(
        raw.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          location: c.location ?? "",
          isActive: c.isActive,
        }))
      );
    }

    setLoading(false);
  }, [pastor.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const availableChurches = allChurches.filter(
    (c) => c.isActive && !assignments.some((a) => a.churchId === c.id)
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addChurchId) return;
    setAdding(true);
    setAddError(null);

    const res = await fetch(`/api/pastors/${pastor.id}/churches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ churchId: addChurchId, isPrimary: addIsPrimary }),
    });

    const data = await res.json();
    if (!res.ok) {
      setAddError(data.error ?? "Une erreur est survenue.");
      setAdding(false);
      return;
    }

    setAddChurchId("");
    setAddIsPrimary(false);
    await fetchData();
    onChanged();
    setAdding(false);
  }

  async function handleTogglePrimary(a: Assignment) {
    setActionId(a.churchId);
    await fetch(`/api/pastors/${pastor.id}/churches/${a.churchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPrimary: !a.isPrimary }),
    });
    await fetchData();
    onChanged();
    setActionId(null);
  }

  async function handleRemove(a: Assignment) {
    setActionId(`${a.churchId}-remove`);
    await fetch(`/api/pastors/${pastor.id}/churches/${a.churchId}`, {
      method: "DELETE",
    });
    await fetchData();
    onChanged();
    setActionId(null);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Affectations</h2>
            <p className="text-sm text-muted-foreground">{pastor.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Assignment list */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Chargement…
            </div>
          )}

          {!loading && assignments.length === 0 && (
            <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Aucune affectation pour le moment.
            </div>
          )}

          <div className="space-y-3">
            {assignments.map((a) => (
              <div
                key={a.churchId}
                className="rounded-xl border border-border bg-neutral-50 px-4 py-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.churchName}</p>
                    {a.location && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.location}</p>
                    )}
                  </div>
                  {a.isPrimary ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary-subtle px-2.5 py-1 text-xs font-semibold text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Principal
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      Délégué
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTogglePrimary(a)}
                    disabled={actionId === a.churchId}
                    className="h-8 flex-1 rounded-lg border border-border text-xs font-medium text-muted-foreground transition-colors hover:bg-white hover:text-foreground disabled:opacity-50"
                  >
                    {actionId === a.churchId
                      ? "…"
                      : a.isPrimary
                      ? "Rendre délégué"
                      : "Rendre principal"}
                  </button>
                  <button
                    onClick={() => handleRemove(a)}
                    disabled={actionId === `${a.churchId}-remove`}
                    className="h-8 rounded-lg border border-red-200 px-3 text-xs font-medium text-danger transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    {actionId === `${a.churchId}-remove` ? "…" : "Retirer"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add church section */}
        <div className="border-t border-border bg-white px-6 py-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Ajouter une église</h3>

          {!loading && availableChurches.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {allChurches.filter((c) => c.isActive).length === 0
                ? "Aucune église active disponible."
                : "Toutes les églises actives sont déjà affectées."}
            </p>
          ) : (
            <form onSubmit={handleAdd} className="space-y-3">
              <select
                value={addChurchId}
                onChange={(e) => setAddChurchId(e.target.value)}
                required
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Sélectionner une église…</option>
                {availableChurches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label className="flex cursor-pointer select-none items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={addIsPrimary}
                  onClick={() => setAddIsPrimary((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 ${
                    addIsPrimary ? "bg-primary" : "bg-neutral-300"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      addIsPrimary ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="text-sm text-foreground">Pasteur principal</span>
              </label>

              {addError && (
                <p className="text-xs text-danger">{addError}</p>
              )}

              <button
                type="submit"
                disabled={adding || !addChurchId}
                className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {adding ? "Affectation…" : "Affecter"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
