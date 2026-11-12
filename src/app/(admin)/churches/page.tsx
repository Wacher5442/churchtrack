import { db } from "@/lib/db";
import ChurchesClient from "./_components/ChurchesClient";

export const metadata = { title: "Églises — ChurchTrack" };

export default async function ChurchesPage() {
  const churches = await db.church.findMany({
    orderBy: { name: "asc" },
    include: {
      pastors: {
        where: { isActive: true, isPrimary: true },
        include: { pastor: { select: { id: true, fullName: true } } },
      },
    },
  });

  const data = churches.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    location: c.location,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    primaryPastor: c.pastors[0]?.pastor.fullName ?? null,
  }));

  return (
    <div className="p-6 lg:p-8">
      <ChurchesClient initialChurches={data} />
    </div>
  );
}
