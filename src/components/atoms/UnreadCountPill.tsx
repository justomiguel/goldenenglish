export interface UnreadCountPillProps {
  /** Visible text, e.g. "3 unread". Nothing renders when `null`. */
  label: string | null;
  /** Accessible name that also names the section the count belongs to. */
  ariaLabel?: string;
}

/** Attention dot + count for content this device has not opened yet. */
export function UnreadCountPill({ label, ariaLabel }: UnreadCountPillProps) {
  if (!label) return null;

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-primary)]/12 px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]"
      aria-label={ariaLabel}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" aria-hidden />
      {label}
    </span>
  );
}
