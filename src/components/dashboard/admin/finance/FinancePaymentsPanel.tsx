import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import { receiptSignedUrlForAdmin } from "@/lib/payments/receiptSignedUrl";
import { PaymentReviewRow } from "@/components/dashboard/PaymentReviewRow";

export interface FinancePaymentsPanelProps {
  supabase: SupabaseClient;
  locale: string;
  dict: Dictionary["admin"]["payments"];
  emptyValue: string;
}

interface ProfileLite {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export async function FinancePaymentsPanel({
  supabase,
  locale,
  dict,
  emptyValue,
}: FinancePaymentsPanelProps) {
  const { data: rows } = await supabase
    .from("payments")
    .select("id, student_id, month, year, amount, receipt_url, status")
    .eq("status", "pending")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(80);

  const list = rows ?? [];
  const ids = [...new Set(list.map((r) => r.student_id as string))];
  const { data: profs } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", ids)
    : { data: [] as ProfileLite[] };
  const nameById = Object.fromEntries(
    ((profs ?? []) as ProfileLite[]).map((p) => [
      p.id,
      `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
    ]),
  );

  const enriched = await Promise.all(
    list.map(async (r) => ({
      ...r,
      signed: r.receipt_url
        ? await receiptSignedUrlForAdmin(r.receipt_url as string)
        : null,
    })),
  );

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
          {dict.title}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {dict.lead}
        </p>
      </header>
      {enriched.length === 0 ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
          {dict.none}
        </p>
      ) : (
        <ul className="space-y-4">
          {enriched.map((r) => (
            <PaymentReviewRow
              key={r.id as string}
              locale={locale}
              paymentId={r.id as string}
              studentLabel={
                nameById[r.student_id as string] ?? String(r.student_id)
              }
              periodLabel={`${r.month}/${r.year}`}
              amountLabel={String(r.amount ?? emptyValue)}
              previewUrl={r.signed}
              labels={dict}
              emptyValue={emptyValue}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
