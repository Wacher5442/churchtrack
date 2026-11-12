import Link from "next/link";

type Report = { id: string; status: "DRAFT" | "SUBMITTED" };

type Props = {
  churchId: string;
  churchName: string;
  location: string;
  isPrimary: boolean;
  report: Report | null;
  periodOpen: boolean;
};

export default function ChurchReportCard({
  churchId,
  churchName,
  location,
  isPrimary,
  report,
  periodOpen,
}: Props) {
  const href = `/pastor/rapports/${churchId}`;

  const statusInfo = getStatusInfo(report, periodOpen);

  return (
    <div className="rounded-xl border border-border bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-foreground">{churchName}</h3>
            {isPrimary ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-subtle px-2 py-0.5 text-[11px] font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Principal
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Délégué
              </span>
            )}
          </div>
          {location && (
            <p className="text-xs text-muted-foreground">{location}</p>
          )}
        </div>

        {/* Status badge */}
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusInfo.badgeClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
          {statusInfo.label}
        </span>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">{statusInfo.description}</p>

        {statusInfo.cta && (
          <Link
            href={href}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors ${statusInfo.ctaClass}`}
          >
            {statusInfo.cta}
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

function getStatusInfo(report: Report | null, periodOpen: boolean) {
  if (!report) {
    if (periodOpen) {
      return {
        label: "Non commencé",
        description: "Aucun rapport saisi pour cette semaine.",
        badgeClass: "border-neutral-200 bg-neutral-100 text-muted-foreground",
        dotClass: "bg-neutral-400",
        cta: "Saisir le rapport",
        ctaClass: "bg-primary text-white hover:bg-primary-hover",
      };
    }
    return {
      label: "Non soumis",
      description: "La période est fermée — aucun rapport soumis.",
      badgeClass: "border-orange-200 bg-orange-50 text-warning",
      dotClass: "bg-warning",
      cta: null,
      ctaClass: "",
    };
  }

  if (report.status === "DRAFT") {
    if (periodOpen) {
      return {
        label: "Brouillon",
        description: "Rapport en cours — non encore soumis.",
        badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
        dotClass: "bg-blue-500",
        cta: "Continuer la saisie",
        ctaClass: "bg-primary text-white hover:bg-primary-hover",
      };
    }
    return {
      label: "Brouillon expiré",
      description: "La période est fermée — ce rapport n'a pas été soumis.",
      badgeClass: "border-orange-200 bg-orange-50 text-warning",
      dotClass: "bg-warning",
      cta: "Voir",
      ctaClass: "border border-border text-foreground hover:bg-neutral-50",
    };
  }

  return {
    label: "Soumis",
    description: "Rapport transmis avec succès.",
    badgeClass: "border-green-200 bg-green-50 text-success",
    dotClass: "bg-success",
    cta: "Voir le rapport",
    ctaClass: "border border-border text-foreground hover:bg-neutral-50",
  };
}
