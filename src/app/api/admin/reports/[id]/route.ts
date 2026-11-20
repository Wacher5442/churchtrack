import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const reportId = BigInt(id);

  const report = await db.weeklyReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });

  if (!report) {
    return NextResponse.json({ error: "Rapport introuvable" }, { status: 404 });
  }

  if (report.status === "SUBMITTED") {
    return NextResponse.json(
      { error: "Impossible de supprimer un rapport soumis." },
      { status: 409 }
    );
  }

  await db.weeklyReport.delete({ where: { id: reportId } });
  return NextResponse.json({ success: true });
}
