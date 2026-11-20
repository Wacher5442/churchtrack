"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="votre@email.com"
          className="w-full h-11 px-4 rounded-xl border border-neutral-200 bg-white text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/8 transition-all duration-150"
        />
      </div>

      {/* Mot de passe */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full h-11 pl-4 pr-11 rounded-xl border border-neutral-200 bg-white text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/8 transition-all duration-150"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPwd ? (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-danger shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Bouton */}
      <button
        type="submit"
        disabled={loading}
        className="relative w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:scale-[0.99] disabled:opacity-60 transition-all duration-150 mt-1"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Connexion…
          </span>
        ) : (
          "Se connecter"
        )}
      </button>

    </form>
  );
}
