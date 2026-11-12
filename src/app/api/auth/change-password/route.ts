import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const userId = BigInt(session.user.id);
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const isSameAsOld = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (isSameAsOld) {
    return NextResponse.json(
      { error: "Le nouveau mot de passe doit être différent de l'ancien." },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(parsed.data.password, 12);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: hash, mustChangePassword: false },
  });

  return NextResponse.json({ success: true });
}
