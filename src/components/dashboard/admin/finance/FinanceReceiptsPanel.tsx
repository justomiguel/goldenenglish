import "server-only";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";

export interface FinanceReceiptsPanelProps {
  supabase: SupabaseClient;
  locale: string;
  dict: Dictionary["dashboard"]["portalBilling"];
  /** Base href for opening individual receipt review screen. */
  receiptHrefBase: string;
}

interface InvoiceLite {
  id: string;
  description: string;
  amount: number;
  student_id: string;
}

interface ProfileLite {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export async function FinanceReceiptsPanel({
  supabase,
  dict,
  receiptHrefBase,
}: FinanceReceiptsPanelProps) {
  const { data: recs } = await supabase
    .from("billing_receipts")
    .select("id, created_at, amount_paid, invoice_id")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true });

  const list = recs ?? [];
  const invIds = [...new Set(list.map((r) => r.invoice_id as string))];

  const { data: invs } = invIds.length
    ? await supabase
        .from("billing_invoices")
        .select("id, description, amount, student_id")
        .in("id", invIds)
    : { data: [] as InvoiceLite[] };

  const invById = Object.fromEntries(
    ((invs ?? []) as InvoiceLite[]).map((i) => [i.id, i]),
  );
  const studIds = [...new Set(((invs ?? []) as InvoiceLite[]).map((i) => i.student_id))];

  const { data: profs } = studIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", studIds)
    : { data: [] as ProfileLite[] };

  const nameById = Object.fromEntries(
    ((profs ?? []) as ProfileLite[]).map((p) => [
      p.id,
      `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
    ]),
  );

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
          {dict.adminListTitle}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {dict.adminListLead}
        </p>
      </header>
      {list.length === 0 ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
          {dict.adminEmpty}
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => {
            const inv = invById[r.invoice_id as string];
            const sid = inv?.student_id;
            return (
              <li
                key={r.id as string}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">
                    {sid ? (nameById[sid] ?? sid) : "—"}
                  </p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {inv?.description ?? "—"} · {dict.adminColAmount}:{" "}
                    {r.amount_paid as number}
                  </p>
                </div>
                <Link
                  href={`${receiptHrefBase}/${r.id}`}
                  title={dict.tipOpenReceiptReview}
                  className="rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
                >
                  {dict.openReview}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
