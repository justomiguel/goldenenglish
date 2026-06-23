import { type InputHTMLAttributes, type ReactNode, useId } from "react";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";

import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import {
  publicEventRegisterFieldClass,
  publicEventRegisterLabelClass,
} from "@/lib/events/publicEventSurfaceClasses";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Renders below the input (e.g. password visibility toggle). */
  footer?: ReactNode;
  surfaceVariant?: PublicEventSurfaceVariant;
}

export function FormField({
  label,
  error,
  hint,
  footer,
  required,
  surfaceVariant = "default",
  ...inputProps
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const isEspacioZenit = surfaceVariant === "espaciozenit";

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} required={required} className={publicEventRegisterLabelClass(surfaceVariant)}>
        {label}
      </Label>
      <Input
        id={id}
        error={error}
        required={required}
        aria-describedby={error ? errorId : undefined}
        className={publicEventRegisterFieldClass(surfaceVariant)}
        {...inputProps}
      />
      {footer}
      {error ? (
        <p id={errorId} className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p className={isEspacioZenit ? "text-sm text-neutral-400" : "text-sm text-[var(--color-muted-foreground)]"}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
