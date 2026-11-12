import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/changer-mot-de-passe");
  if (session.user.role === "ADMIN") redirect("/admin/dashboard");
  redirect("/pastor/dashboard");
}
