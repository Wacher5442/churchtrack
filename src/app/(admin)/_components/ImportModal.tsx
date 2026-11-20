"use client";

import { useState, useRef } from "react";

type ImportType = "churches" | "pastors";

type ParsedChurch = { name: string; location: string; _error?: string };
type ParsedPastor = { fullName: string; email: string; _error?: string };
type ParsedRow = ParsedChurch | ParsedPastor;

type CreatedPastor = { fullName: string; email: string; tempPassword: string };

type Props = {
  type: ImportType;
  onClose: () => void;
  onImported: () => void;
};

export default function ImportModal({ type, onClose, onImported }: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<{ created: number; skipped: number; credentials?: CreatedPastor[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isChurches = type === "churches";
  const validRows = rows.filter((r) => !r._error);
  const errorRows = rows.filter((r) => r._error);

  async function downloadTemplate() {
    const { utils, writeFile } = await import("xlsx");
    const headers = isChurches ? ["Nom", "Localisation"] : ["Nom complet", "Email"];
    const example = isChurches
      ? ["Église Alpha", "Paris 15e"]
      : ["Jean Dupont", "jean.dupont@email.com"];
    const ws = utils.aoa_to_sheet([headers, example]);
    ws["!cols"] = headers.map(() => ({ wch: 28 }));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, isChurches ? "Églises" : "Pasteurs");
    writeFile(wb, `modele-import-${isChurches ? "eglises" : "pasteurs"}.xlsx`);
  }

  async function parseFile(file: File) {
    setError(null);
    try {
      const { read, utils } = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, string>[] = utils.sheet_to_json(ws, { defval: "" });

      if (raw.length === 0) {
        setError("Le fichier est vide.");
        return;
      }

      const parsed: ParsedRow[] = raw.map((row, i) => {
        const norm: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) {
          norm[k.trim().toLowerCase()] = String(v).trim();
        }

        if (isChurches) {
          const name = norm["nom"] ?? norm["name"] ?? norm["church"] ?? "";
          const location = norm["localisation"] ?? norm["lieu"] ?? norm["location"] ?? "";
          if (!name) return { name: "", location, _error: `Ligne ${i + 2} : le nom est requis` };
          return { name, location };
        } else {
          const fullName = norm["nom complet"] ?? norm["nom"] ?? norm["name"] ?? "";
          const email = norm["email"] ?? norm["mail"] ?? norm["e-mail"] ?? "";
          if (!fullName) return { fullName: "", email, _error: `Ligne ${i + 2} : le nom est requis` };
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return { fullName, email, _error: `Ligne ${i + 2} : email invalide "${email}"` };
          return { fullName, email };
        }
      });

      setRows(parsed);
      setStep("preview");
    } catch {
      setError("Impossible de lire ce fichier. Vérifiez qu'il s'agit d'un fichier .xlsx, .xls ou .csv.");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }

  async function handleImport() {
    setStep("importing");
    setError(null);

    const url = isChurches ? "/api/churches/import" : "/api/pastors/import";
    const body = isChurches
      ? { rows: validRows.map((r) => ({ name: (r as ParsedChurch).name, location: (r as ParsedChurch).location || undefined })) }
      : { rows: validRows.map((r) => ({ fullName: (r as ParsedPastor).fullName, email: (r as ParsedPastor).email })) };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
      setStep("preview");
      return;
    }

    setResult(data);
    setStep("done");
    onImported();
  }

  async function downloadCredentials(credentials: CreatedPastor[]) {
    const { utils, writeFile } = await import("xlsx");
    const headers = ["Nom complet", "Email", "Mot de passe temporaire"];
    const dataRows = credentials.map((c) => [c.fullName, c.email, c.tempPassword]);
    const ws = utils.aoa_to_sheet([headers, ...dataRows]);
    ws["!cols"] = [{ wch: 25 }, { wch: 32 }, { wch: 22 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Identifiants");
    writeFile(wb, "identifiants-pasteurs.xlsx");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Importer des {isChurches ? "églises" : "pasteurs"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-neutral-100 transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* UPLOAD */}
          {step === "upload" && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Importez plusieurs {isChurches ? "églises" : "pasteurs"} en une fois à partir d&apos;un fichier Excel.
              </p>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary hover:bg-primary/[0.02] transition-colors mb-4"
              >
                <svg
                  className="mx-auto mb-3 text-muted-foreground"
                  width="32" height="32" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm font-medium text-foreground">Cliquez ou déposez un fichier</p>
                <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls ou .csv</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {error && (
                <p className="text-sm text-danger bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                  {error}
                </p>
              )}

              <div className="bg-neutral-50 rounded-xl p-4 mb-3">
                <p className="text-sm font-semibold text-foreground mb-2">Colonnes attendues</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {isChurches ? (
                    <>
                      <p><span className="font-medium text-foreground">Nom</span> — requis</p>
                      <p><span className="font-medium text-foreground">Localisation</span> — optionnel</p>
                    </>
                  ) : (
                    <>
                      <p><span className="font-medium text-foreground">Nom complet</span> — requis</p>
                      <p><span className="font-medium text-foreground">Email</span> — requis, doit être unique</p>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Télécharger le modèle Excel
              </button>
            </div>
          )}

          {/* PREVIEW */}
          {step === "preview" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">
                  {rows.length} ligne{rows.length > 1 ? "s" : ""} détectée{rows.length > 1 ? "s" : ""}
                  {errorRows.length > 0 && (
                    <span className="ml-1.5 text-danger">
                      ({errorRows.length} erreur{errorRows.length > 1 ? "s" : ""})
                    </span>
                  )}
                </p>
                <button
                  onClick={() => { setStep("upload"); setRows([]); setError(null); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Changer de fichier
                </button>
              </div>

              {errorRows.length > 0 && (
                <div className="mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 space-y-0.5">
                  {errorRows.map((r, i) => (
                    <p key={i} className="text-xs text-danger">{r._error}</p>
                  ))}
                  {validRows.length > 0 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Les {validRows.length} lignes valides seront tout de même importées.
                    </p>
                  )}
                </div>
              )}

              <div className="border border-border rounded-xl overflow-hidden max-h-56 overflow-y-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 sticky top-0">
                    <tr>
                      {isChurches ? (
                        <>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Nom</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Localisation</th>
                        </>
                      ) : (
                        <>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Nom complet</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Email</th>
                        </>
                      )}
                      <th className="w-6 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row, i) => (
                      <tr key={i} className={row._error ? "bg-red-50" : ""}>
                        {isChurches ? (
                          <>
                            <td className="px-3 py-2 text-foreground">
                              {(row as ParsedChurch).name || (
                                <span className="text-danger italic">vide</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {(row as ParsedChurch).location || "—"}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 text-foreground">
                              {(row as ParsedPastor).fullName || (
                                <span className="text-danger italic">vide</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {(row as ParsedPastor).email || (
                                <span className="text-danger italic">vide</span>
                              )}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${row._error ? "bg-danger" : "bg-success"}`}
                            title={row._error}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && (
                <p className="text-sm text-danger bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-border text-sm font-medium hover:bg-neutral-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  disabled={validRows.length === 0}
                  className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  Importer {validRows.length} ligne{validRows.length > 1 ? "s" : ""}
                </button>
              </div>
            </div>
          )}

          {/* IMPORTING */}
          {step === "importing" && (
            <div className="py-10 flex flex-col items-center gap-3">
              <span className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Import en cours…</p>
            </div>
          )}

          {/* DONE */}
          {step === "done" && result && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 shrink-0">
                  <svg
                    width="20" height="20" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2.5} className="text-success"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {result.created} {isChurches ? "église" : "pasteur"}{result.created > 1 ? "s" : ""} importé{result.created > 1 ? "s" : ""}
                  </p>
                  {result.skipped > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {result.skipped} ignoré{result.skipped > 1 ? "s" : ""} (déjà existant{result.skipped > 1 ? "s" : ""})
                    </p>
                  )}
                </div>
              </div>

              {result.credentials && result.credentials.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-foreground">Identifiants générés</p>
                    <button
                      onClick={() => downloadCredentials(result.credentials!)}
                      className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                    >
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Télécharger (.xlsx)
                    </button>
                  </div>
                  <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-neutral-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Nom</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Email</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Mot de passe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {result.credentials.map((c, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-foreground">{c.fullName}</td>
                            <td className="px-3 py-2 text-muted-foreground">{c.email}</td>
                            <td className="px-3 py-2 font-mono text-primary">{c.tempPassword}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Les pasteurs devront changer leur mot de passe à la première connexion.
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full h-10 rounded-xl border border-border text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
