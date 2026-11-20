"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
            <path d="M14 3L4 9v16h7v-7h6v7h7V9L14 3z" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Vous êtes hors ligne</h1>
        <p className="text-sm text-muted-foreground mb-6">
          ChurchTrack nécessite une connexion internet pour afficher les données en temps réel.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Réessayer
        </button>
      </div>
    </div>
  );
}
