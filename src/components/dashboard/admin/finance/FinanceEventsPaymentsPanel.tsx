import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

interface FinanceEventsPaymentsPanelProps {
  supabase: SupabaseClient;
  dict: Dictionary["admin"]["finance"]["events"];
  locale: string;
}

export async function FinanceEventsPaymentsPanel({
  supabase,
  dict,
  locale,
}: FinanceEventsPaymentsPanelProps) {
  const { data: rows } = await supabase
    .from("event_payments")
    .select("id, status, amount, currency, event_attendee_id, event_attendees!inner(first_name,last_name)")
    .order("created_at", { ascending: false })
    .limit(120);

  const list = rows ?? [];
  if (list.length === 0) {
    return (
      <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-muted-foreground)]">
        {dict.empty}
      </p>
    );
  }

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{dict.title}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{dict.lead}</p>
      <ul className="space-y-2">
        {list.map((row) => {
          const attendee = row.event_attendees as
            | { first_name: string | null; last_name: string | null }
            | { first_name: string | null; last_name: string | null }[]
            | null;
          const attendeeRow = Array.isArray(attendee) ? attendee[0] : attendee;
          const attendeeName = attendeeRow
            ? formatProfileSnakeSurnameFirst({
                first_name: attendeeRow.first_name,
                last_name: attendeeRow.last_name,
              })
            : String(row.event_attendee_id);

          const status = String(row.status ?? "pending");
          const statusLabel =
            status === "approved"
              ? dict.approvedLabel
              : status === "rejected"
                ? dict.rejectedLabel
                : dict.pendingLabel;

          return (
            <li
              key={String(row.id)}
              className="flex items-center justify-between rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            >
              <span>{attendeeName}</span>
              <span className="text-[var(--color-muted-foreground)]">
                {new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: String(row.currency ?? "CLP"),
                  maximumFractionDigits: 2,
                }).format(Number(row.amount ?? 0))}{" "}
                · {statusLabel}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
