import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createSchema = z.object({
  fullName: z.string().min(1, "Le nom est requis").max(150),
  email: z.string().email("Email invalide").max(180),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

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
        select: { churchId: true, isPrimary: true },
      },
    },
  });

  return NextResponse.json(
    pastors.map((p) => ({
      id: p.id.toString(),
      fullName: p.fullName,
      email: p.email,
      isActive: p.isActive,
      mustChangePassword: p.mustChangePassword,
      createdAt: p.createdAt,
      churchAssignments: p.churchAssignments.map((a) => ({
        churchId: a.churchId.toString(),
        isPrimary: a.isPrimary,
      })),
    }))
  );
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

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Cette adresse email est déjà utilisée." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const pastor = await db.user.create({
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      passwordHash,
      role: "PASTOR",
      mustChangePassword: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    { id: pastor.id.toString(), fullName: pastor.fullName, email: pastor.email, isActive: pastor.isActive, mustChangePassword: pastor.mustChangePassword, createdAt: pastor.createdAt },
    { status: 201 }
  );
}
