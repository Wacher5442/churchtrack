import { db } from "./db";

export function getSundayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function isPeriodOpen(
  weekStart: Date,
  reportId?: bigint
): Promise<boolean> {
  if (reportId) {
    const report = await db.weeklyReport.findUnique({
      where: { id: reportId },
      select: { periodUnlockedAt: true },
    });
    if (report?.periodUnlockedAt) return true;
  }

  const config = await db.appConfig.findUnique({ where: { id: 1 } });
  const windowDays = config?.submissionWindowDays ?? 6;

  const now = new Date();
  const closeDate = new Date(weekStart);
  closeDate.setDate(closeDate.getDate() + windowDays);
  closeDate.setHours(23, 59, 59, 999);

  return now <= closeDate;
}

export function getCurrentPeriod(): { weekStart: Date; weekEnd: Date } {
  const weekStart = getSundayOfWeek();
  const weekEnd = getWeekEnd(weekStart);
  return { weekStart, weekEnd };
}
