import type { LucideIcon } from "lucide-react";
import { Ban, CheckCircle2, CircleDashed, Clock3, XCircle } from "lucide-react";
import type { AttendeePresentationTone } from "@/lib/events/resolveAttendeePresentation";

const TONE_SURFACE: Record<AttendeePresentationTone, string> = {
  success:
    "border-[color-mix(in_srgb,var(--color-success)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-success)_14%,var(--color-surface))] text-[var(--color-success)]",
  warning:
    "border-[color-mix(in_srgb,var(--color-warning)_40%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-warning)_18%,var(--color-surface))] text-[color-mix(in_srgb,var(--color-warning)_82%,var(--color-foreground))]",
  error:
    "border-[color-mix(in_srgb,var(--color-error)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-error)_12%,var(--color-surface))] text-[var(--color-error)]",
  muted: "border-[var(--color-border)] bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)]",
};

const TONE_ICON: Record<AttendeePresentationTone, LucideIcon> = {
  success: CheckCircle2,
  warning: Clock3,
  error: XCircle,
  muted: CircleDashed,
};

interface AdminEventAttendeePresentationBadgeProps {
  label: string;
  tone: AttendeePresentationTone;
  icon?: LucideIcon;
}

export function AdminEventAttendeePresentationBadge({
  label,
  tone,
  icon,
}: AdminEventAttendeePresentationBadgeProps) {
  const Icon = icon ?? TONE_ICON[tone];

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE_SURFACE[tone]}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function AdminEventAttendeeNoPaymentBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 px-2.5 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
      <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}
