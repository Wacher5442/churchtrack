"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ChurchFormModal from "./ChurchFormModal";

type Church = {
  id: string;
  name: string;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  primaryPastor: string | null;
};

type Props = { initialChurches: Church[] };

export default function ChurchesClient({ initialChurches }: Props) {
  const router = useRouter();
  const [churches, setChurches] = useState<Church[]>(initialChurches);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Church | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/churches");
    if (!res.ok) return;
    const data = await res.json();
    setChurches(
      data.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        location: c.location,
        isActive: c.isActive,
        createdAt: c.createdAt,
        primaryPastor: c.pastors?.[0]?.pastor?.fullName ?? null,
      }))
    );
    router.refresh();
  }, [router]);

  async function toggleStatus(church: Church) {
    setTogglingId(church.id);
    await fetch(`/api/churches/${church.id}/status`, { method: "PATCH" });
    await refresh();
    setTogglingId(null);
  }

  const filtered = churches.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.location ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const active = churches.filter((c) => c.isActive).length;

  return (
    <>
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Églises</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active} active{active > 1 ? "s" : ""} sur {churches.length}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle église
        </button>
      </div>

      {/* Recherche */}
      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou localisation…"
            className="w-full max-w-sm h-10 pl-10 pr-4 rounded-lg border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white"
          />
        </div>
      </div>

      {/* Table desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-neutral-50">
              <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Nom</th>
              <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Localisation</th>
              <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Pasteur principal</th>
              <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Statut</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  Aucune église trouvée.
                </td>
              </tr>
            )}
            {filtered.map((church) => (
              <tr key={church.id} className="hover:bg-neutral-50/60 transition-colors">
                <td className="px-5 py-4 font-medium text-foreground">{church.name}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {church.location ?? <span className="text-neutral-300">—</span>}
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {church.primaryPastor ?? <span className="text-neutral-300">Non affecté</span>}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge isActive={church.isActive} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setEditing(church); setShowModal(true); }}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-colors"
                      title="Modifier"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleStatus(church)}
                      disabled={togglingId === church.id}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                        church.isActive
                          ? "text-warning hover:bg-orange-50"
                          : "text-success hover:bg-green-50"
                      }`}
                      title={church.isActive ? "Désactiver" : "Activer"}
                    >
                      {church.isActive ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-border px-5 py-10 text-center text-muted-foreground text-sm">
            Aucune église trouvée.
          </div>
        )}
        {filtered.map((church) => (
          <div key={church.id} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold text-foreground">{church.name}</p>
                {church.location && (
                  <p className="text-sm text-muted-foreground">{church.location}</p>
                )}
              </div>
              <StatusBadge isActive={church.isActive} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {church.primaryPastor
                ? `Pasteur : ${church.primaryPastor}`
                : "Aucun pasteur affecté"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(church); setShowModal(true); }}
                className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-neutral-50 transition-colors"
              >
                Modifier
              </button>
              <button
                onClick={() => toggleStatus(church)}
                disabled={togglingId === church.id}
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  church.isActive
                    ? "text-warning border border-orange-200 hover:bg-orange-50"
                    : "text-success border border-green-200 hover:bg-green-50"
                }`}
              >
                {church.isActive ? "Désactiver" : "Activer"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <ChurchFormModal
          church={editing}
          onClose={() => setShowModal(false)}
          onSaved={refresh}
        />
      )}
    </>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        isActive
          ? "bg-green-50 text-success border border-green-200"
          : "bg-neutral-100 text-muted-foreground border border-neutral-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-success" : "bg-neutral-400"}`} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
