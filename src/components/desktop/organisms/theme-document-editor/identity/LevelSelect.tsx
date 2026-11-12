export function LevelSelect({
  label,
  value,
  options,
  locked,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  locked: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[var(--color-foreground)]">
      <span>{label}</span>
      <select
        aria-label={label}
        className="min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
        value={value}
        disabled={locked}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
