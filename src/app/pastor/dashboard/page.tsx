import { auth } from "@/auth";

export const metadata = { title: "Tableau de bord — ChurchTrack" };

export default async function PastorDashboardPage() {
  const session = await auth();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Bonjour, {session?.user?.name ?? "Pasteur"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bienvenue sur votre espace ChurchTrack.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-subtle">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-foreground mb-1">Tableau de bord pasteur</h2>
        <p className="text-sm text-muted-foreground">
          Cette section sera disponible en Phase 2.
        </p>
      </div>
    </div>
  );
}
