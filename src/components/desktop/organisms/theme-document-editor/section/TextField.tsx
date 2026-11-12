export function TextField({
  label,
  value,
  maxLength,
  counter,
  onChange,
}: {
  label: string;
  value: string;
  maxLength: number;
  counter: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[var(--color-foreground)]">
      <span>{label}</span>
      <input
        aria-label={label}
        maxLength={maxLength}
        value={value}
        className="min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="text-xs text-[var(--color-muted-foreground)]">{counter}</span>
    </label>
  );
}
