import Link from "next/link";
import { db } from "@/lib/db";
import ChurchesClient from "./_components/ChurchesClient";
import PastorsClient from "../pastors/_components/PastorsClient";

export const metadata = { title: "Organisation — ChurchTrack" };

export default async function OrganisationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "eglises" } = await searchParams;
  const isChurches = tab !== "pasteurs";

  const [churches, pastors] = await Promise.all([
    db.church.findMany({
      orderBy: { name: "asc" },
      include: {
        pastors: {
          where: { isActive: true, isPrimary: true },
          include: { pastor: { select: { id: true, fullName: true } } },
        },
      },
    }),
    db.user.findMany({
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
    }),
  ]);

  const churchData = churches.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    location: c.location,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    primaryPastor: c.pastors[0]?.pastor.fullName ?? null,
  }));

  const pastorData = pastors.map((p) => ({
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Organisation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gérez vos églises et vos pasteurs
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg w-fit mb-6">
        <Link
          href="/churches"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isChurches
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Églises
          <span className={`text-xs font-semibold tabular-nums ${isChurches ? "text-primary" : "text-neutral-400"}`}>
            {churches.length}
          </span>
        </Link>
        <Link
          href="/churches?tab=pasteurs"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            !isChurches
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pasteurs
          <span className={`text-xs font-semibold tabular-nums ${!isChurches ? "text-primary" : "text-neutral-400"}`}>
            {pastors.length}
          </span>
        </Link>
      </div>

      {isChurches ? (
        <ChurchesClient initialChurches={churchData} />
      ) : (
        <PastorsClient initialPastors={pastorData} />
      )}
    </div>
  );
}
