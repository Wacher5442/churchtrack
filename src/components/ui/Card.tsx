import { type HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
};

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export default function Card({ padding = "md", className = "", children, ...props }: Props) {
  return (
    <div
      className={["rounded-xl border border-border bg-white", PADDING[padding], className].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
