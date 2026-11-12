import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(150),
  location: z.string().max(255).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const churches = await db.church.findMany({
    orderBy: { name: "asc" },
    include: {
      pastors: {
        where: { isActive: true, isPrimary: true },
        include: { pastor: { select: { id: true, fullName: true } } },
      },
    },
  });

  return NextResponse.json(churches);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const church = await db.church.create({
    data: { name: parsed.data.name, location: parsed.data.location },
  });

  return NextResponse.json(church, { status: 201 });
}
