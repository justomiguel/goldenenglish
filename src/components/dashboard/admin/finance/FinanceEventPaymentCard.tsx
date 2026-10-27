import { AdminEventAttendeePresentationBadge } from "@/components/dashboard/admin/events/AdminEventAttendeePresentationBadge";
import { resolveAttendeePaymentStatusTone } from "@/lib/events/resolveAttendeePresentation";

const STATUS_BAR: Record<string, string> = {
  approved: "bg-[var(--color-success)]",
  pending: "bg-[var(--color-warning)]",
  rejected: "bg-[var(--color-error)]",
};

interface FinanceEventPaymentCardProps {
  attendeeName: string;
  eventTitle: string;
  amountLabel: string;
  statusLabel: string;
  status: string;
}

export function FinanceEventPaymentCard({
  attendeeName,
  eventTitle,
  amountLabel,
  statusLabel,
  status,
}: FinanceEventPaymentCardProps) {
  const bar = STATUS_BAR[status] ?? "bg-[var(--color-border)]";

  return (
    <li className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 shadow-[var(--shadow-soft)]">
      <span className={`h-12 w-1.5 shrink-0 rounded-full ${bar}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-[var(--color-foreground)]">{attendeeName}</p>
        <p className="mt-0.5 truncate text-sm text-[var(--color-muted-foreground)]">{eventTitle}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <p className="text-lg font-semibold text-[var(--color-foreground)]">{amountLabel}</p>
        <AdminEventAttendeePresentationBadge
          label={statusLabel}
          tone={resolveAttendeePaymentStatusTone(status)}
        />
      </div>
    </li>
  );
}
