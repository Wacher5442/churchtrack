export const metadata = { title: "Tableau de bord — ChurchTrack" };

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">Vue d&apos;ensemble de l&apos;activité</p>
      </div>
      <div className="rounded-xl border border-border bg-white p-8 text-center text-muted-foreground text-sm">
        Le tableau de bord sera disponible à la Phase 3.
      </div>
    </div>
  );
}
