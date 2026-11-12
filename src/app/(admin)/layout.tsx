import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");
  if (session.user.mustChangePassword) redirect("/changer-mot-de-passe");

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar userName={session.user.name ?? "Admin"} />
      <main className="flex-1 min-w-0 lg:overflow-auto">
        <div className="pt-14 lg:pt-0">{children}</div>
      </main>
    </div>
  );
}
