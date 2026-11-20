import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PastorTopNav from "@/components/layout/PastorTopNav";
import PastorBottomTabs from "@/components/layout/PastorBottomTabs";

export default async function PastorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || session.user.role !== "PASTOR") redirect("/login");
  if (session.user.mustChangePassword) redirect("/changer-mot-de-passe");

  return (
    /*
     * Mobile : flex column sur toute la hauteur de l'écran.
     *   - PastorTopNav   → shrink-0, dans le flow (pas fixed)
     *   - main           → flex-1 + overflow-y-auto, le seul élément qui défile
     *   - PastorBottomTabs → shrink-0 en bas, toujours visible, jamais scrollé
     *
     * Desktop (sm+) : block classique.
     *   - PastorTopNav   → redevient fixed via sm:fixed (voir le composant)
     *   - main           → pt-14 pour compenser le nav fixed
     *   - PastorBottomTabs → sm:hidden
     */
    <div className="bg-neutral-50 flex flex-col overflow-hidden h-screen sm:block sm:min-h-screen sm:h-auto sm:overflow-visible">
      <PastorTopNav userName={session.user.name ?? "Pasteur"} />
      <main className="flex-1 overflow-y-auto sm:flex-none sm:overflow-visible sm:pt-14">
        {children}
      </main>
      <PastorBottomTabs />
    </div>
  );
}
