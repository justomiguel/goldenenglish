import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { receiptSignedUrlForAdmin } from "@/lib/payments/receiptSignedUrl";
import { PaymentReviewRow } from "@/components/dashboard/PaymentReviewRow";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPaymentsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
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
    : { data: [] as { id: string; first_name: string; last_name: string }[] };
  const nameById = Object.fromEntries(
    (profs ?? []).map((p) => [
      p.id,
      `${p.first_name} ${p.last_name}`.trim(),
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

  if (enriched.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
          {dict.admin.payments.title}
        </h1>
        <p className="mt-4 text-[var(--color-muted-foreground)]">
          {dict.admin.payments.none}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.payments.title}
      </h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        {dict.admin.payments.lead}
      </p>
      <ul className="mt-8 space-y-4">
        {enriched.map((r) => (
          <PaymentReviewRow
            key={r.id as string}
            locale={locale}
            paymentId={r.id as string}
            studentLabel={
              nameById[r.student_id as string] ?? String(r.student_id)
            }
            periodLabel={`${r.month}/${r.year}`}
            amountLabel={String(r.amount ?? dict.common.emptyValue)}
            previewUrl={r.signed}
            labels={dict.admin.payments}
            emptyValue={dict.common.emptyValue}
          />
        ))}
      </ul>
    </div>
  );
}
