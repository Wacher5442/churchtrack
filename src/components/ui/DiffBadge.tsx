type Props = {
  diff: number | null | undefined;
  className?: string;
};

export default function DiffBadge({ diff, className = "" }: Props) {
  if (diff == null) return null;

  if (diff === 0) {
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground ${className}`}>
        <span>→</span> stable
      </span>
    );
  }

  if (diff > 0) {
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold text-success tabular-nums ${className}`}>
        <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        +{diff.toLocaleString("fr-FR")}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold text-danger tabular-nums ${className}`}>
      <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
      {diff.toLocaleString("fr-FR")}
    </span>
  );
}
