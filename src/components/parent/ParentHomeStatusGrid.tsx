import { CalendarCheck, MessageSquare, Wallet } from "lucide-react";
import type { ParentHomePillarSnapshot } from "@/lib/parent/buildParentHomePillarSnapshot";
import type { Dictionary } from "@/types/i18n";
import { ParentHomeStatusCard } from "@/components/parent/ParentHomeStatusCard";

export interface ParentHomeStatusGridProps {
  locale: string;
  pillars: ParentHomePillarSnapshot;
  labels: Dictionary["dashboard"]["parent"]["homeInbox"];
  variant?: "default" | "pwa";
}

function statusLabel(level: ParentHomePillarSnapshot["attendance"]["level"], labels: ParentHomeStatusGridProps["labels"]) {
  if (level === "ok") return labels.statusOk;
  if (level === "attention") return labels.statusAttention;
  return labels.statusUnknown;
}

export function ParentHomeStatusGrid({
  locale,
  pillars,
  labels,
  variant = "default",
}: ParentHomeStatusGridProps) {
  const base = `/${locale}/dashboard/parent`;
  const { attendance, messages, payments } = pillars;

  const attendanceDetail =
    attendance.monthPercent != null
      ? attendance.level === "attention"
        ? labels.attendanceAttentionDetail.replace("{pct}", String(attendance.monthPercent))
        : labels.attendanceOkDetail.replace("{pct}", String(attendance.monthPercent))
      : labels.attendanceUnknownDetail;

  const messagesDetail =
    messages.staffInboundCount > 0
      ? labels.messagesAttentionDetail.replace("{count}", String(messages.staffInboundCount))
      : labels.messagesOkDetail;

  const paymentsDetail =
    payments.level === "attention"
      ? payments.hasOverdueMonthly && payments.overdueInvoiceCount > 0
        ? labels.paymentsAttentionBoth
            .replace("{invoiceCount}", String(payments.overdueInvoiceCount))
        : payments.hasOverdueMonthly
          ? labels.paymentsAttentionOverdue
          : labels.paymentsAttentionInvoices.replace(
              "{count}",
              String(payments.overdueInvoiceCount),
            )
      : labels.paymentsOkDetail;

  return (
    <section aria-label={labels.pillarsAria} className="space-y-3">
      {variant === "pwa" ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.pwaPillarsLead}</p>
      ) : null}
      <ul className={`grid gap-3 ${variant === "pwa" ? "grid-cols-1" : "sm:grid-cols-1"}`}>
        <li>
          <ParentHomeStatusCard
            href={`${base}/calendar`}
            title={labels.pillarAttendanceTitle}
            detail={attendanceDetail}
            statusLabel={statusLabel(attendance.level, labels)}
            level={attendance.level}
            icon={CalendarCheck}
            variant={variant}
          />
        </li>
        <li>
          <ParentHomeStatusCard
            href={`${base}/messages`}
            title={labels.pillarMessagesTitle}
            detail={messagesDetail}
            statusLabel={statusLabel(messages.level, labels)}
            level={messages.level}
            icon={MessageSquare}
            variant={variant}
          />
        </li>
        <li>
          <ParentHomeStatusCard
            href={`${base}/payments`}
            title={labels.pillarPaymentsTitle}
            detail={paymentsDetail}
            statusLabel={statusLabel(payments.level, labels)}
            level={payments.level}
            icon={Wallet}
            variant={variant}
          />
        </li>
      </ul>
    </section>
  );
}
