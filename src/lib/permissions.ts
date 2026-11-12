import { db } from "./db";

export async function isPastorAssignedToChurch(
  pastorId: bigint,
  churchId: bigint
): Promise<boolean> {
  const assignment = await db.pastorChurch.findFirst({
    where: { pastorId, churchId, isActive: true },
  });
  return assignment !== null;
}

export async function assertPastorAccess(
  pastorId: bigint,
  churchId: bigint
): Promise<void> {
  const hasAccess = await isPastorAssignedToChurch(pastorId, churchId);
  if (!hasAccess) {
    throw new Error("Accès non autorisé à cette église");
  }
}
