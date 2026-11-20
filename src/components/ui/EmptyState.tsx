type Props = {
  message: string;
  description?: string;
  action?: React.ReactNode;
  dashed?: boolean;
};

export default function EmptyState({ message, description, action, dashed = true }: Props) {
  return (
    <div
      className={[
        "rounded-xl border bg-white p-10 text-center",
        dashed ? "border-dashed border-border" : "border-border",
      ].join(" ")}
    >
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
