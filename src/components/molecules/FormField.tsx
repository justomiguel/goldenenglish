import { type InputHTMLAttributes, type ReactNode, useId } from "react";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Renders below the input (e.g. password visibility toggle). */
  footer?: ReactNode;
}

export function FormField({
  label,
  error,
  hint,
  footer,
  required,
  ...inputProps
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <Input
        id={id}
        error={error}
        required={required}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {footer}
      {error ? (
        <p id={errorId} className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
}
