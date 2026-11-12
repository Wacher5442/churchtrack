import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PastorSidebar from "@/components/layout/PastorSidebar";

export default async function PastorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || session.user.role !== "PASTOR") redirect("/login");
  if (session.user.mustChangePassword) redirect("/changer-mot-de-passe");

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <PastorSidebar userName={session.user.name ?? "Pasteur"} />
      <main className="flex-1 lg:pl-64 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
