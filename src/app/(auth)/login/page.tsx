import LoginForm from "./_components/LoginForm";

export const metadata = { title: "Connexion — ChurchTrack" };

const FEATURES = [
  "Collecte des rapports hebdomadaires par église",
  "Statistiques et classements en temps réel",
  "Accès différencié admin et pasteurs",
];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Panneau gauche ── */}
      <div className="relative lg:w-[42%] bg-primary overflow-hidden flex flex-col">

        {/* Éléments décoratifs */}
        <svg
          aria-hidden
          className="absolute -bottom-16 -right-16 w-80 h-80 text-white opacity-[0.06] pointer-events-none"
          viewBox="0 0 320 320" fill="none"
        >
          <circle cx="160" cy="160" r="155" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="160" cy="160" r="110" stroke="currentColor" strokeWidth="1" />
          <circle cx="160" cy="160" r="65"  stroke="currentColor" strokeWidth="1" />
          <circle cx="160" cy="160" r="22"  fill="currentColor" />
        </svg>
        <svg
          aria-hidden
          className="absolute -top-24 -left-24 w-64 h-64 text-white opacity-[0.04] pointer-events-none"
          viewBox="0 0 256 256" fill="none"
        >
          <circle cx="128" cy="128" r="128" fill="currentColor" />
        </svg>
        {/* Grille de points */}
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Contenu */}
        <div className="relative z-10 flex flex-col h-full px-8 py-10 lg:px-12 lg:py-12">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <path d="M14 3L4 9v16h7v-7h6v7h7V9L14 3z" fill="white" fillOpacity="0.95" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">ChurchTrack</span>
          </div>

          {/* Accroche principale */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-white/60 text-sm font-medium tracking-wide uppercase mb-5">
              Espace de gestion
            </p>
            <h1 className="text-white font-bold leading-[1.15] mb-6"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
              Vos rapports<br />
              d&rsquo;église,<br />
              enfin centralisés.
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Collectez, suivez et analysez les indicateurs hebdomadaires de votre réseau depuis une interface unifiée.
            </p>
          </div>

          {/* Fonctionnalités */}
          <ul className="space-y-3 mt-10">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-white/70 text-sm leading-snug">{f}</span>
              </li>
            ))}
          </ul>

          {/* Pied */}
          <p className="mt-10 text-white/30 text-xs">
            © {new Date().getFullYear()} ChurchTrack
          </p>
        </div>
      </div>

      {/* ── Panneau droit ── */}
      <div className="flex-1 bg-[#f7f8f8] flex items-center justify-center px-6 py-14 lg:py-0">
        <div className="w-full max-w-[360px]">

          {/* En-tête du formulaire */}
          <div className="mb-9">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
              Connexion
            </p>
            <h2 className="text-[1.65rem] font-bold text-foreground leading-tight">
              Bon retour.
            </h2>
          </div>

          <LoginForm />

        </div>
      </div>

    </div>
  );
}
