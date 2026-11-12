import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(150),
  location: z.string().max(255).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const church = await db.church.findUnique({
    where: { id: BigInt(id) },
    include: {
      pastors: {
        where: { isActive: true },
        include: { pastor: { select: { id: true, fullName: true } } },
      },
    },
  });

  if (!church) {
    return NextResponse.json({ error: "Église introuvable" }, { status: 404 });
  }

  return NextResponse.json(church);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const church = await db.church.update({
    where: { id: BigInt(id) },
    data: { name: parsed.data.name, location: parsed.data.location },
  });

  return NextResponse.json(church);
}
