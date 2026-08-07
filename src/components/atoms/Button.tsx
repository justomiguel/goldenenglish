import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "destructiveStrong";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)] hover:scale-[1.03] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100 focus-visible:ring-[var(--color-primary)]",
  secondary:
    "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-dark)] hover:scale-[1.03] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100 focus-visible:ring-[var(--color-secondary)]",
  ghost:
    "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)] focus-visible:ring-[var(--color-border)]",
  /**
   * Quiet destructive trigger: transparent background with an error-coloured
   * border (3:1 non-text threshold — every tenant clears this).  The label
   * stays in --color-foreground so it is legible everywhere, including tenants
   * like Mi Mundo where error text fails the 4.5 AA threshold.
   *
   * No hover scale — an inviting grow animation is wrong on a control whose
   * best outcome is that the user does not press it.
   */
  destructive:
    "bg-transparent border border-[var(--color-error)] text-[var(--color-foreground)] hover:bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] focus-visible:ring-[var(--color-error)]",
  /**
   * Strong destructive confirm: solid error fill with white text.
   * White on default error (#DC2626): 4.83 — passes AA.
   * White on Mi Mundo error (#E22E30): 4.50 (spec) / 4.499 (utility) — at threshold.
   *
   * Use only for the confirm button inside a confirmation dialog.
   * No hover scale for the same reason as destructive.
   */
  destructiveStrong:
    "bg-[var(--color-error)] text-white hover:bg-[color-mix(in_srgb,var(--color-error)_85%,black)] focus-visible:ring-[var(--color-error)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-[var(--layout-border-radius)] transition-[transform,colors,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
