"use client";

import { useState } from "react";

type Props = {
  pastor: { id: string; fullName: string };
  onClose: () => void;
  onReset: (tempPassword: string) => void;
};

function generateTempPassword() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Ct-${digits}!`;
}

export default function ResetPasswordModal({ pastor, onClose, onReset }: Props) {
  const [password, setPassword] = useState(generateTempPassword());
  const [showPassword, setShowPassword] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/auth/reset-password/${pastor.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    onReset(password);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">
            Réinitialiser le mot de passe
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-neutral-100">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          Définissez un nouveau mot de passe temporaire pour{" "}
          <span className="font-medium text-foreground">{pastor.fullName}</span>.
          Le pasteur devra le changer à sa prochaine connexion.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nouveau mot de passe temporaire
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 pr-10 rounded-lg border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={showPassword
                      ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    } />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPassword(generateTempPassword())}
                className="h-11 px-3.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-neutral-50 transition-colors"
              >
                Générer
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-lg border border-border text-sm font-medium hover:bg-neutral-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-60 transition-colors"
            >
              {loading ? "Réinitialisation…" : "Réinitialiser"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
