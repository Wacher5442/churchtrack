import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  rows: z
    .array(
      z.object({
        fullName: z.string().min(1),
        email: z.string().email(),
      })
    )
    .min(1)
    .max(500),
});

function generateTempPassword() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Ct-${digits}!`;
}

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

  const emails = parsed.data.rows.map((r) => r.email.toLowerCase());
  const existing = await db.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const existingEmails = new Set(existing.map((u) => u.email.toLowerCase()));

  const toCreate = parsed.data.rows.filter(
    (r) => !existingEmails.has(r.email.toLowerCase())
  );
  const skipped = parsed.data.rows.length - toCreate.length;

  const credentials: { fullName: string; email: string; tempPassword: string }[] = [];

  for (const row of toCreate) {
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await db.user.create({
      data: {
        fullName: row.fullName,
        email: row.email.toLowerCase(),
        passwordHash,
        role: "PASTOR",
        mustChangePassword: true,
      },
    });
    credentials.push({
      fullName: row.fullName,
      email: row.email.toLowerCase(),
      tempPassword,
    });
  }

  return NextResponse.json({ created: toCreate.length, skipped, credentials });
}
