import type { Dictionary } from "@/types/i18n";

type InboxDict = Dictionary["admin"]["finance"]["inbox"];

/** Pure: hours since upload and UI tokens for inbox aging chip. */
export function computeInboxAgingVisual(
  uploadedAtIso: string,
  nowMs: number,
  dict: InboxDict,
): {
  hours: number;
  label: string;
  colorClasses: string;
} {
  const ms = nowMs - new Date(uploadedAtIso).getTime();
  const hours = Math.max(0, Math.floor(ms / 3_600_000));
  const days = Math.floor(hours / 24);

  const label =
    days >= 1
      ? dict.agingDays.replace("{days}", String(days))
      : dict.agingHours.replace("{hours}", String(hours));

  const colorClasses =
    hours > 72
      ? "border-[var(--color-error)]/30 bg-[var(--color-error)]/10 text-[var(--color-error)]"
      : hours > 24
        ? "border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
        : "border-[var(--color-border)] bg-[var(--color-muted)]/30 text-[var(--color-muted-foreground)]";

  return { hours, label, colorClasses };
}
