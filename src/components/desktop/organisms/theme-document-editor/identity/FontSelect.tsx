export function FontSelect({
  label,
  value,
  fonts,
  locked,
  onChange,
}: {
  label: string;
  value: string;
  fonts: readonly { id: string; family: string }[];
  locked: boolean;
  onChange: (id: string) => void;
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
        {fonts.map((font) => (
          <option key={font.id} value={font.id}>
            {font.family}
          </option>
        ))}
      </select>
    </label>
  );
}
