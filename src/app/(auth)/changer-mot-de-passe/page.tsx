import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "./_components/ChangePasswordForm";

export const metadata = { title: "Changer le mot de passe — ChurchTrack" };

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session) redirect("/login");
  if (!session.user.mustChangePassword) redirect("/");

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[820px] rounded-2xl overflow-hidden shadow-xl flex flex-col sm:flex-row">

        {/* Panneau gauche */}
        <div className="relative bg-primary sm:w-[42%] flex flex-col items-center justify-center px-8 py-10 overflow-hidden">
          <svg aria-hidden className="absolute -bottom-12 -right-12 w-56 h-56 text-white opacity-[0.07] pointer-events-none" viewBox="0 0 320 320" fill="none">
            <circle cx="160" cy="160" r="155" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="160" cy="160" r="110" stroke="currentColor" strokeWidth="1" />
            <circle cx="160" cy="160" r="65" stroke="currentColor" strokeWidth="1" />
            <circle cx="160" cy="160" r="22" fill="currentColor" />
          </svg>
          <svg aria-hidden className="absolute -top-16 -left-16 w-48 h-48 text-white opacity-[0.05] pointer-events-none" viewBox="0 0 256 256" fill="none">
            <circle cx="128" cy="128" r="128" fill="currentColor" />
          </svg>
          <svg aria-hidden className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
          <div className="relative z-10 flex flex-col items-center text-center">
            <img src="/church.png" alt="ChurchTrack" width={64} height={64} className="mb-4" />
            <h1 className="text-xl font-bold text-white">ChurchTrack</h1>
            <p className="text-sm text-white/60 mt-2 leading-relaxed max-w-[180px]">
              Vos rapports d'église centralisés
            </p>
          </div>
        </div>

        {/* Panneau droit */}
        <div className="flex-1 bg-white flex items-center justify-center px-8 py-10 sm:py-12">
          <div className="w-full max-w-[300px]">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Nouveau mot de passe</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Bonjour <span className="font-medium text-foreground">{session.user.name}</span>,
                définissez votre mot de passe personnel.
              </p>
            </div>
            <div className="bg-primary-light rounded-lg px-4 py-3 mb-6 text-sm text-primary font-medium border border-primary/20">
              Première connexion — mot de passe temporaire à changer.
            </div>
            <ChangePasswordForm />
          </div>
        </div>

      </div>
    </div>
  );
}
