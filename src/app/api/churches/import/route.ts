import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  rows: z
    .array(
      z.object({
        name: z.string().min(1),
        location: z.string().optional(),
      })
    )
    .min(1)
    .max(500),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const names = parsed.data.rows.map((r) => r.name);
  const existing = await db.church.findMany({
    where: { name: { in: names } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));

  const toCreate = parsed.data.rows.filter(
    (r) => !existingNames.has(r.name.toLowerCase())
  );
  const skipped = parsed.data.rows.length - toCreate.length;

  if (toCreate.length > 0) {
    await db.church.createMany({
      data: toCreate.map((r) => ({
        name: r.name,
        location: r.location || null,
      })),
    });
  }

  return NextResponse.json({ created: toCreate.length, skipped });
}
