import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminFinanceReceiptsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();

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
    : { data: [] as { id: string; description: string; amount: number; student_id: string }[] };

  const invById = Object.fromEntries((invs ?? []).map((i) => [i.id, i]));
  const studIds = [...new Set((invs ?? []).map((i) => i.student_id))];

  const { data: profs } = studIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", studIds)
    : { data: [] as { id: string; first_name: string; last_name: string }[] };

  const nameById = Object.fromEntries(
    (profs ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim()]),
  );

  if (list.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
          {dict.dashboard.portalBilling.adminListTitle}
        </h1>
        <p className="mt-4 text-[var(--color-muted-foreground)]">
          {dict.dashboard.portalBilling.adminEmpty}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.dashboard.portalBilling.adminListTitle}
      </h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        {dict.dashboard.portalBilling.adminListLead}
      </p>
      <ul className="mt-8 space-y-3">
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
                  {inv?.description ?? "—"} · {dict.dashboard.portalBilling.adminColAmount}:{" "}
                  {r.amount_paid as number}
                </p>
              </div>
              <Link
                href={`/${locale}/dashboard/admin/finance/receipts/${r.id}`}
                title={dict.dashboard.portalBilling.tipOpenReceiptReview}
                className="rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
              >
                {dict.dashboard.portalBilling.openReview}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
