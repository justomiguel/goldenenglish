export function LocalizedTextField({
  label,
  value,
  maxLength,
  locales,
  onChange,
}: {
  label: string;
  value: Record<"es" | "en" | "pt", string>;
  maxLength: number;
  locales: { es: string; en: string; pt: string };
  onChange: (value: Record<"es" | "en" | "pt", string>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {(["es", "en", "pt"] as const).map((locale) => {
        const name = `${label} ${locales[locale]}`;
        return (
          <label key={locale} className="flex flex-col gap-1 text-sm text-[var(--color-foreground)]">
            <span>{name}</span>
            <input
              aria-label={name}
              maxLength={maxLength}
              value={value[locale]}
              className="min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
              onChange={(event) => onChange({ ...value, [locale]: event.target.value })}
            />
          </label>
        );
      })}
    </div>
  );
}
