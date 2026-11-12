import { db } from "@/lib/db";
import PastorsClient from "./_components/PastorsClient";

export const metadata = { title: "Pasteurs — ChurchTrack" };

export default async function PastorsPage() {
  const pastors = await db.user.findMany({
    where: { role: "PASTOR" },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      churchAssignments: {
        where: { isActive: true },
        select: { isPrimary: true },
      },
    },
  });

  const data = pastors.map((p) => ({
    id: p.id.toString(),
    fullName: p.fullName,
    email: p.email,
    isActive: p.isActive,
    mustChangePassword: p.mustChangePassword,
    createdAt: p.createdAt.toISOString(),
    churchCount: p.churchAssignments.length,
  }));

  return (
    <div className="p-6 lg:p-8">
      <PastorsClient initialPastors={data} />
    </div>
  );
}
