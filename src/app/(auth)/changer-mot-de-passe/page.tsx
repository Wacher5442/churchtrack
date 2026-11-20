import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "./_components/ChangePasswordForm";

export const metadata = { title: "Changer le mot de passe — ChurchTrack" };

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session) redirect("/login");
  if (!session.user.mustChangePassword) redirect("/");

  return (
    <div className="min-h-screen bg-primary-subtle flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 3L4 9v16h7v-7h6v7h7V9L14 3z"
              fill="white"
              fillOpacity="0.9"
            />
            <path d="M12 13h4v4h-4z" fill="white" fillOpacity="0.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">ChurchTrack</h1>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Choisissez votre mot de passe
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bonjour{" "}
            <span className="font-medium text-foreground">
              {session.user.name}
            </span>
            . Pour sécuriser votre compte, veuillez définir un mot de passe
            personnel.
          </p>
        </div>

        <div className="bg-primary-light rounded-lg px-4 py-3 mb-6 text-sm text-primary font-medium border border-primary/20">
          Première connexion — vous devez changer le mot de passe temporaire.
        </div>

        <ChangePasswordForm />
      </div>
    </div>
    </div>
  );
}
