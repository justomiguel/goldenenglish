export interface SiteThemeTemplatesShellAlertsProps {
  rowError: string | null;
  truncated: boolean;
  rowsLength: number;
  total: number;
  truncatedNotice: string;
}

export function SiteThemeTemplatesShellAlerts({
  rowError,
  truncated,
  rowsLength,
  total,
  truncatedNotice,
}: SiteThemeTemplatesShellAlertsProps) {
  return (
    <>
      {rowError ? (
        <p
          role="alert"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {rowError}
        </p>
      ) : null}

      {truncated ? (
        <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
          {truncatedNotice
            .replace("{{shown}}", String(rowsLength))
            .replace("{{total}}", String(total))}
        </p>
      ) : null}
    </>
  );
}
