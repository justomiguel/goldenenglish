"use client";

import { type InputHTMLAttributes, forwardRef, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

/**
 * Number fields keep a draft while the value is being edited so a lone `0`
 * can be deleted. Parents that do `Number("")` (which is `0`) cannot snap
 * the box back until blur.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { error, className = "", type, value, onChange, onFocus, onBlur, ...props },
    ref,
  ) {
    const [numberDraft, setNumberDraft] = useState<string | null>(null);
    const isNumber = type === "number";
    const controlled = value !== undefined;
    const shown = isNumber && numberDraft !== null ? numberDraft : value;

    return (
      <input
        ref={ref}
        type={type}
        className={`w-full rounded-[var(--layout-border-radius)] border px-3 py-2 text-sm transition-colors placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 ${
          error
            ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)]"
            : "border-[var(--color-border)] focus-visible:ring-[var(--color-primary)]"
        } ${className}`}
        aria-invalid={error ? "true" : undefined}
        {...props}
        {...(controlled || numberDraft !== null ? { value: shown } : {})}
        onFocus={(event) => {
          if (isNumber && controlled) {
            setNumberDraft(value === "" || value == null ? "" : String(value));
          }
          onFocus?.(event);
        }}
        onChange={(event) => {
          if (isNumber && controlled) setNumberDraft(event.target.value);
          onChange?.(event);
        }}
        onBlur={(event) => {
          if (isNumber) setNumberDraft(null);
          onBlur?.(event);
        }}
      />
    );
  },
);
