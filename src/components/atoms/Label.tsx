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
      className={`block text-sm font-medium text-[var(--color-foreground)] ${
        required
          ? "after:ml-1 after:inline after:text-[var(--color-error)] after:content-['*']"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
