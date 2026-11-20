import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "warning";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary/40",
  secondary:
    "border border-border bg-white text-foreground hover:bg-neutral-50 focus-visible:ring-neutral-300",
  ghost:
    "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-300",
  danger:
    "border border-red-200 bg-red-50 text-danger hover:bg-red-100 focus-visible:ring-red-200",
  warning:
    "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 focus-visible:ring-amber-200",
};

const SIZE: Record<Size, string> = {
  sm: "h-7 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", size = "md", loading, disabled, className = "", children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANT[variant],
        SIZE[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
);

Button.displayName = "Button";
export default Button;
