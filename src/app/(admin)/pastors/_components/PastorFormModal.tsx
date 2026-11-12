"use client";

import { useState, useEffect } from "react";

type Pastor = { id: string; fullName: string; email: string };

type CreatedPayload = { fullName: string; email: string; tempPassword: string };

type Props = {
  pastor?: Pastor | null;
  onClose: () => void;
  onSaved: (created?: CreatedPayload) => void;
};

function generateTempPassword() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Ct-${digits}!`;
}

export default function PastorFormModal({ pastor, onClose, onSaved }: Props) {
  const isEdit = !!pastor;
  const [fullName, setFullName] = useState(pastor?.fullName ?? "");
  const [email, setEmail] = useState(pastor?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFullName(pastor?.fullName ?? "");
    setEmail(pastor?.email ?? "");
    setPassword("");
    setError(null);
  }, [pastor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isEdit ? `/api/pastors/${pastor.id}` : "/api/pastors";
    const method = isEdit ? "PUT" : "POST";
    const body = isEdit
      ? { fullName, email }
      : { fullName, email, password };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    if (isEdit) {
      onSaved();
      onClose();
    } else {
      onSaved({ fullName, email, tempPassword: password });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? "Modifier le pasteur" : "Nouveau pasteur"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-neutral-100 transition-colors"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nom complet <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={150}
              placeholder="Ex : Pasteur Jean Dupont"
              className="w-full h-11 px-3.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Adresse email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={180}
              placeholder="pasteur@exemple.com"
              className="w-full h-11 px-3.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Mot de passe temporaire <span className="text-danger">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 pr-10 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { setPassword(generateTempPassword()); setShowPassword(true); }}
                  className="h-11 px-3.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-neutral-50 hover:text-foreground transition-colors whitespace-nowrap"
                >
                  Générer
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                8 car. min · 1 majuscule · 1 chiffre. Le pasteur devra le changer à la connexion.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-danger bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-neutral-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-60 transition-colors"
            >
              {loading ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le compte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
