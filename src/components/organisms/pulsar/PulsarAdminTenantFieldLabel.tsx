export interface PulsarAdminTenantFieldLabelProps {
  htmlFor: string;
  text: string;
  mark?: string;
}

export function PulsarAdminTenantFieldLabel({
  htmlFor,
  text,
  mark,
}: PulsarAdminTenantFieldLabelProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="block text-xs font-semibold">
        {text}
      </label>
      {mark ? (
        <span className="shrink-0 text-xs font-semibold text-[var(--color-muted-foreground)]">
          {mark}
        </span>
      ) : null}
    </div>
  );
}
