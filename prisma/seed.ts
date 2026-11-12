import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  await db.appConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, submissionWindowDays: 6 },
  });

  const adminHash = await bcrypt.hash("Admin@1234", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@churchtrack.app" },
    update: {},
    create: {
      fullName: "Administrateur",
      email: "admin@churchtrack.app",
      passwordHash: adminHash,
      role: Role.ADMIN,
      mustChangePassword: false,
    },
  });

  const churches = await Promise.all([
    db.church.upsert({
      where: { id: BigInt(1) },
      update: {},
      create: { name: "Église Cocody", location: "Cocody, Abidjan" },
    }),
    db.church.upsert({
      where: { id: BigInt(2) },
      update: {},
      create: { name: "Église Yopougon", location: "Yopougon, Abidjan" },
    }),
    db.church.upsert({
      where: { id: BigInt(3) },
      update: {},
      create: { name: "Église Plateau", location: "Plateau, Abidjan" },
    }),
  ]);

  const pastorHash = await bcrypt.hash("Pasteur@1234", 12);
  const pastor = await db.user.upsert({
    where: { email: "pasteur.demo@churchtrack.app" },
    update: {},
    create: {
      fullName: "Pasteur Démo",
      email: "pasteur.demo@churchtrack.app",
      passwordHash: pastorHash,
      role: Role.PASTOR,
      mustChangePassword: true,
    },
  });

  await db.pastorChurch.upsert({
    where: { pastorId_churchId: { pastorId: pastor.id, churchId: churches[0].id } },
    update: {},
    create: { pastorId: pastor.id, churchId: churches[0].id, isPrimary: true },
  });

  await db.pastorChurch.upsert({
    where: { pastorId_churchId: { pastorId: pastor.id, churchId: churches[1].id } },
    update: {},
    create: { pastorId: pastor.id, churchId: churches[1].id, isPrimary: false },
  });

  console.log("✓ Seed terminé");
  console.log("  Admin   : admin@churchtrack.app / Admin@1234");
  console.log("  Pasteur : pasteur.demo@churchtrack.app / Pasteur@1234 (doit changer mdp)");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
