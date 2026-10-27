import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import { FinanceEventPaymentCard } from "@/components/dashboard/admin/finance/FinanceEventPaymentCard";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

interface FinanceEventsPaymentsPanelProps {
  supabase: SupabaseClient;
  dict: Dictionary["admin"]["finance"]["events"];
  locale: string;
}

interface AttendeeEmbed {
  first_name: string | null;
  last_name: string | null;
  events: { title: string | null } | { title: string | null }[] | null;
}

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function FinanceEventsPaymentsPanel({
  supabase,
  dict,
  locale,
}: FinanceEventsPaymentsPanelProps) {
  const { data: rows } = await supabase
    .from("event_payments")
    .select(
      "id, status, amount, currency, event_attendee_id, event_attendees!inner(first_name, last_name, events!inner(title))",
    )
    .order("created_at", { ascending: false })
    .limit(120);

  const list = rows ?? [];
  if (list.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background)] p-5 text-sm text-[var(--color-muted-foreground)] shadow-[var(--shadow-soft)]">
        {dict.empty}
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{dict.title}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{dict.lead}</p>
      <ul className="space-y-2">
        {list.map((row) => {
          const attendee = firstRow(row.event_attendees as AttendeeEmbed | AttendeeEmbed[] | null);
          const event = firstRow(attendee?.events);
          const attendeeName = attendee
            ? formatProfileSnakeSurnameFirst({
                first_name: attendee.first_name,
                last_name: attendee.last_name,
              })
            : String(row.event_attendee_id);
          const status = String(row.status ?? "pending");
          const statusLabel =
            status === "approved"
              ? dict.approvedLabel
              : status === "rejected"
                ? dict.rejectedLabel
                : dict.pendingLabel;
          const amountLabel = new Intl.NumberFormat(locale, {
            style: "currency",
            currency: String(row.currency ?? "CLP"),
            maximumFractionDigits: 2,
          }).format(Number(row.amount ?? 0));

          return (
            <FinanceEventPaymentCard
              key={String(row.id)}
              attendeeName={attendeeName}
              eventTitle={String(event?.title ?? "")}
              amountLabel={amountLabel}
              statusLabel={statusLabel}
              status={status}
            />
          );
        })}
      </ul>
    </section>
  );
}
