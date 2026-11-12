"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PastorFormModal from "./PastorFormModal";
import ResetPasswordModal from "./ResetPasswordModal";
import CredentialsModal from "./CredentialsModal";
import AssignmentPanel from "./AssignmentPanel";

type Pastor = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  churchCount: number;
};

type Credentials = { fullName: string; email: string; tempPassword: string };

type Props = { initialPastors: Pastor[] };

export default function PastorsClient({ initialPastors }: Props) {
  const router = useRouter();
  const [pastors, setPastors] = useState<Pastor[]>(initialPastors);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Pastor | null>(null);
  const [resetting, setResetting] = useState<Pastor | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [assigningTo, setAssigningTo] = useState<Pastor | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/pastors");
    if (!res.ok) return;
    const data = await res.json();
    setPastors(
      data.map((p: any) => ({
        id: p.id.toString(),
        fullName: p.fullName,
        email: p.email,
        isActive: p.isActive,
        mustChangePassword: p.mustChangePassword,
        createdAt: p.createdAt,
        churchCount: p.churchAssignments?.length ?? 0,
      }))
    );
    router.refresh();
  }, [router]);

  async function toggleStatus(pastor: Pastor) {
    setTogglingId(pastor.id);
    await fetch(`/api/pastors/${pastor.id}/status`, { method: "PATCH" });
    await refresh();
    setTogglingId(null);
  }


  const filtered = pastors.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  const active = pastors.filter((p) => p.isActive).length;

  return (
    <>
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pasteurs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active} actif{active > 1 ? "s" : ""} sur {pastors.length}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouveau pasteur
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
            placeholder="Rechercher par nom ou email…"
            className="w-full max-w-sm h-10 pl-10 pr-4 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white"
          />
        </div>
      </div>

      {/* Table desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-neutral-50">
              <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Nom</th>
              <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Email</th>
              <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Églises</th>
              <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Statut</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  Aucun pasteur trouvé.
                </td>
              </tr>
            )}
            {filtered.map((pastor) => (
              <tr key={pastor.id} className="hover:bg-neutral-50/60 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {pastor.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{pastor.fullName}</p>
                      {pastor.mustChangePassword && (
                        <span className="text-xs text-warning">Connexion initiale en attente</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{pastor.email}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {pastor.churchCount === 0
                    ? <span className="text-neutral-300">Non affecté</span>
                    : `${pastor.churchCount} église${pastor.churchCount > 1 ? "s" : ""}`}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge isActive={pastor.isActive} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setAssigningTo(pastor)}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-colors"
                      title="Gérer les affectations"
                    >
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setEditing(pastor); setShowForm(true); }}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-colors"
                      title="Modifier"
                    >
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setResetting(pastor)}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-colors"
                      title="Réinitialiser le mot de passe"
                    >
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleStatus(pastor)}
                      disabled={togglingId === pastor.id}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                        pastor.isActive
                          ? "text-warning hover:bg-orange-50"
                          : "text-success hover:bg-green-50"
                      }`}
                      title={pastor.isActive ? "Désactiver" : "Activer"}
                    >
                      {pastor.isActive ? (
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            Aucun pasteur trouvé.
          </div>
        )}
        {filtered.map((pastor) => (
          <div key={pastor.id} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {pastor.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{pastor.fullName}</p>
                  <p className="text-xs text-muted-foreground">{pastor.email}</p>
                </div>
              </div>
              <StatusBadge isActive={pastor.isActive} />
            </div>
            {pastor.mustChangePassword && (
              <p className="text-xs text-warning mb-2 pl-12">Connexion initiale en attente</p>
            )}
            <p className="text-xs text-muted-foreground pl-12 mb-3">
              {pastor.churchCount === 0 ? "Non affecté" : `${pastor.churchCount} église${pastor.churchCount > 1 ? "s" : ""}`}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAssigningTo(pastor)}
                className="flex-1 h-9 rounded-lg border border-border text-xs font-medium hover:bg-neutral-50 transition-colors min-w-[80px]"
              >
                Affectations
              </button>
              <button
                onClick={() => { setEditing(pastor); setShowForm(true); }}
                className="flex-1 h-9 rounded-lg border border-border text-xs font-medium hover:bg-neutral-50 transition-colors min-w-[80px]"
              >
                Modifier
              </button>
              <button
                onClick={() => setResetting(pastor)}
                className="flex-1 h-9 rounded-lg border border-border text-xs font-medium hover:bg-neutral-50 transition-colors min-w-[80px]"
              >
                Réinit. mdp
              </button>
              <button
                onClick={() => toggleStatus(pastor)}
                disabled={togglingId === pastor.id}
                className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 border min-w-[80px] ${
                  pastor.isActive
                    ? "text-warning border-orange-200 hover:bg-orange-50"
                    : "text-success border-green-200 hover:bg-green-50"
                }`}
              >
                {pastor.isActive ? "Désactiver" : "Activer"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showForm && (
        <PastorFormModal
          pastor={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={(created) => {
            setShowForm(false);
            setEditing(null);
            if (created) {
              setCredentials(created);
            }
            refresh();
          }}
        />
      )}

      {resetting && (
        <ResetPasswordModal
          pastor={resetting}
          onClose={() => setResetting(null)}
          onReset={(tempPassword) => {
            setResetting(null);
            setCredentials({ fullName: resetting.fullName, email: resetting.email, tempPassword });
          }}
        />
      )}

      {credentials && (
        <CredentialsModal
          fullName={credentials.fullName}
          email={credentials.email}
          tempPassword={credentials.tempPassword}
          onClose={() => { setCredentials(null); refresh(); }}
        />
      )}

      {assigningTo && (
        <AssignmentPanel
          pastor={assigningTo}
          onClose={() => setAssigningTo(null)}
          onChanged={refresh}
        />
      )}
    </>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
      isActive
        ? "bg-green-50 text-success border border-green-200"
        : "bg-neutral-100 text-muted-foreground border border-neutral-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-success" : "bg-neutral-400"}`} />
      {isActive ? "Actif" : "Inactif"}
    </span>
  );
}
