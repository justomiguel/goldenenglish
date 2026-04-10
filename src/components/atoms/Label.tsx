import { type LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({
  children,
  required,
  className = "",
  ...props
}: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-[var(--color-foreground)] ${className}`}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-1 text-[var(--color-error)]" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}
