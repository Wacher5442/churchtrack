type Variant = "success" | "draft" | "danger" | "warning" | "neutral" | "primary";

const STYLES: Record<Variant, { wrap: string; dot: string; label: string }> = {
  success: {
    wrap: "border-green-200 bg-green-50",
    dot: "bg-success",
    label: "text-success",
  },
  draft: {
    wrap: "border-blue-200 bg-blue-50",
    dot: "bg-blue-500",
    label: "text-blue-700",
  },
  danger: {
    wrap: "border-red-200 bg-red-50",
    dot: "bg-danger",
    label: "text-danger",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50",
    dot: "bg-amber-400",
    label: "text-amber-700",
  },
  neutral: {
    wrap: "border-neutral-200 bg-neutral-100",
    dot: "bg-neutral-400",
    label: "text-muted-foreground",
  },
  primary: {
    wrap: "border-primary/20 bg-primary-subtle",
    dot: "bg-primary",
    label: "text-primary",
  },
};

type Props = {
  variant: Variant;
  label: string;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
};

export default function Badge({ variant, label, dot = true, pulse = false, className = "" }: Props) {
  const s = STYLES[variant];
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        s.wrap,
        s.label,
        className,
      ].join(" ")}
    >
      {dot && (
        <span
          className={[
            "h-1.5 w-1.5 rounded-full",
            s.dot,
            pulse ? "animate-pulse" : "",
          ].join(" ")}
        />
      )}
      {label}
    </span>
  );
}

/* Badges prêts à l'emploi pour les statuts de rapport */
export function ReportBadge({ status }: { status: string | null }) {
  if (status === "SUBMITTED") return <Badge variant="success" label="Soumis" />;
  if (status === "DRAFT") return <Badge variant="draft" label="Brouillon" />;
  return <Badge variant="neutral" label="Non commencé" dot={false} />;
}
