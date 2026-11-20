import { db } from "@/lib/db";
import SettingsClient from "./_components/SettingsClient";

export const metadata = { title: "Paramètres — ChurchTrack" };

export default async function SettingsPage() {
  const config = await db.appConfig.findUnique({
    where: { id: 1 },
    include: { updatedBy: { select: { fullName: true } } },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configuration de l&apos;application.
        </p>
      </div>

      <div className="max-w-2xl">
        <SettingsClient
          initialValue={config?.submissionWindowDays ?? 6}
          initialNotificationsEnabled={config?.notificationsEnabled ?? true}
          initialReminderDays={config?.reminderDaysBeforeClose ?? 1}
          updatedAt={config?.updatedAt?.toISOString() ?? null}
          updatedBy={config?.updatedBy?.fullName ?? null}
        />
      </div>
    </div>
  );
}
