interface AdminEventAttendeeFieldCellProps {
  label: string;
  value: string;
  prominent?: boolean;
  mono?: boolean;
  title?: string;
}

export function AdminEventAttendeeFieldCell({
  label,
  value,
  prominent = false,
  mono = false,
  title,
}: AdminEventAttendeeFieldCellProps) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p
        title={title ?? value}
        className={`mt-0.5 break-words ${
          prominent
            ? "text-sm font-semibold text-[var(--color-foreground)]"
            : mono
              ? "font-mono text-xs text-[var(--color-foreground)]"
              : "text-sm text-[var(--color-foreground)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
