import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  fullName: z.string().min(1).max(150),
  email: z.string().email().max(180),
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
  const pastor = await db.user.findUnique({
    where: { id: BigInt(id), role: "PASTOR" },
    select: {
      id: true,
      fullName: true,
      email: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      churchAssignments: {
        where: { isActive: true },
        include: { church: { select: { id: true, name: true } } },
      },
    },
  });

  if (!pastor) {
    return NextResponse.json({ error: "Pasteur introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    id: pastor.id.toString(),
    fullName: pastor.fullName,
    email: pastor.email,
    isActive: pastor.isActive,
    mustChangePassword: pastor.mustChangePassword,
    createdAt: pastor.createdAt,
    churchAssignments: pastor.churchAssignments.map((a) => ({
      churchId: a.church.id.toString(),
      churchName: a.church.name,
      isPrimary: a.isPrimary,
      isActive: a.isActive,
    })),
  });
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

  const conflict = await db.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: BigInt(id) } },
  });
  if (conflict) {
    return NextResponse.json(
      { error: "Cette adresse email est déjà utilisée." },
      { status: 409 }
    );
  }

  const pastor = await db.user.update({
    where: { id: BigInt(id) },
    data: { fullName: parsed.data.fullName, email: parsed.data.email },
    select: { id: true, fullName: true, email: true, isActive: true },
  });

  return NextResponse.json({
    id: pastor.id.toString(),
    fullName: pastor.fullName,
    email: pastor.email,
    isActive: pastor.isActive,
  });
}
