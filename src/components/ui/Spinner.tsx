type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
};

export default function Spinner({ size = "md", className = "" }: Props) {
  return (
    <span
      className={[
        "inline-block animate-spin rounded-full border-neutral-200 border-t-primary",
        SIZES[size],
        className,
      ].join(" ")}
      aria-label="Chargement…"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
