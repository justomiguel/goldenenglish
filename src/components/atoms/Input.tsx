import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ error, className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-[var(--layout-border-radius)] border px-3 py-2 text-sm transition-colors placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 ${
          error
            ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)]"
            : "border-[var(--color-border)] focus-visible:ring-[var(--color-primary)]"
        } ${className}`}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    );
  },
);
