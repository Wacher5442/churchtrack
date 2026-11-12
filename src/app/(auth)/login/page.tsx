import LoginForm from "./_components/LoginForm";

export const metadata = { title: "Connexion — ChurchTrack" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      {/* Logo / Marque */}
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
        <p className="text-sm text-muted-foreground mt-1">
          Suivi des rapports hebdomadaires
        </p>
      </div>

      {/* Carte */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
        <h2 className="text-lg font-semibold text-foreground mb-6">
          Connexion
        </h2>
        <LoginForm />
      </div>
    </div>
  );
}
