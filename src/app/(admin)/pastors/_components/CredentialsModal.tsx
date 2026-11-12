"use client";

type Props = {
  fullName: string;
  email: string;
  tempPassword: string;
  onClose: () => void;
};

export default function CredentialsModal({ fullName, email, tempPassword, onClose }: Props) {
  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-success">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Compte créé avec succès</h2>
            <p className="text-sm text-muted-foreground">Communiquez ces identifiants à {fullName}</p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 mb-5 text-sm text-amber-800">
          Ces identifiants ne seront affichés qu&apos;une seule fois. Notez-les avant de fermer.
        </div>

        {/* Credentials */}
        <div className="space-y-3 mb-6">
          <CredentialRow
            label="Email"
            value={email}
            onCopy={() => copyToClipboard(email)}
          />
          <CredentialRow
            label="Mot de passe temporaire"
            value={tempPassword}
            mono
            onCopy={() => copyToClipboard(tempPassword)}
          />
        </div>

        <button
          onClick={onClose}
          className="w-full h-11 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          J&apos;ai noté les identifiants
        </button>
      </div>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-neutral-50 px-4 py-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
        <button
          onClick={onCopy}
          className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:bg-neutral-200 hover:text-foreground transition-colors"
          title="Copier"
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
