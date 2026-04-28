import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";
import { receiptSignedUrlForAdmin } from "@/lib/payments/receiptSignedUrl";
import { PaymentReviewRow } from "@/components/dashboard/PaymentReviewRow";
import { EnrollmentFeeReceiptQueueRow } from "./EnrollmentFeeReceiptQueueRow";
import {
  FinancePaymentsInvoiceReceiptsBlock,
  type FinancePaymentsInvoiceReceiptsBlockProps,
} from "./FinancePaymentsInvoiceReceiptsBlock";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export interface FinancePaymentsPanelProps {
  supabase: SupabaseClient;
  locale: Locale;
  dict: Dictionary["admin"]["payments"];
  portalBillingDict: Dictionary["dashboard"]["portalBilling"];
  enrollmentFeeQueueDict: Dictionary["admin"]["finance"]["enrollmentFeeQueue"];
  emptyValue: string;
  receiptHrefBase: string;
}

interface ProfileLite {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface EnrollmentFeeReceiptRow {
  id: string;
  student_id: string;
  enrollment_fee_receipt_url: string | null;
  enrollment_fee_receipt_uploaded_at: string | null;
  academic_sections: { name: string } | { name: string }[] | null;
}

interface InvoiceLite {
  id: string;
  description: string;
  amount: number;
  student_id: string;
}

export async function FinancePaymentsPanel({
  supabase,
  locale,
  dict,
  portalBillingDict,
  enrollmentFeeQueueDict,
  emptyValue,
  receiptHrefBase,
}: FinancePaymentsPanelProps) {
  // ── Enrollment fee receipts ───────────────────────────────────────────────
  const { data: efRawRows } = await supabase
    .from("section_enrollments")
    .select(
      "id, student_id, enrollment_fee_receipt_url, enrollment_fee_receipt_uploaded_at, academic_sections(name)",
    )
    .eq("enrollment_fee_receipt_status", "pending")
    .not("enrollment_fee_receipt_url", "is", null)
    .order("enrollment_fee_receipt_uploaded_at", { ascending: true });

  const efRows = (efRawRows ?? []) as EnrollmentFeeReceiptRow[];
  const efStudIds = [...new Set(efRows.map((r) => r.student_id))];

  const { data: efProfs } = efStudIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", efStudIds)
    : { data: [] as ProfileLite[] };

  const efNameById = Object.fromEntries(
    ((efProfs ?? []) as ProfileLite[]).map((p) => [
      p.id,
      formatProfileSnakeSurnameFirst(p),
    ]),
  );

  const efRowsWithUrls = await Promise.all(
    efRows.map(async (row) => {
      const path = row.enrollment_fee_receipt_url;
      if (!path) return { ...row, signedUrl: null };
      const { data } = await supabase.storage
        .from("payment-receipts")
        .createSignedUrl(path, 3600);
      return { ...row, signedUrl: data?.signedUrl ?? null };
    }),
  );

  // ── Monthly payment receipts (payments table) ─────────────────────────────
  const { data: payRows } = await supabase
    .from("payments")
    .select("id, student_id, month, year, amount, receipt_url, status")
    .eq("status", "pending")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(80);

  const payList = payRows ?? [];
  const payStudIds = [...new Set(payList.map((r) => r.student_id as string))];

  const { data: payProfs } = payStudIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", payStudIds)
    : { data: [] as ProfileLite[] };

  const payNameById = Object.fromEntries(
    ((payProfs ?? []) as ProfileLite[]).map((p) => [
      p.id,
      formatProfileSnakeSurnameFirst(p),
    ]),
  );

  const payEnriched = await Promise.all(
    payList.map(async (r) => ({
      ...r,
      signed: r.receipt_url
        ? await receiptSignedUrlForAdmin(r.receipt_url as string)
        : null,
    })),
  );

  // ── Invoice receipts (billing_receipts) ──────────────────────────────────
  const { data: invRecs } = await supabase
    .from("billing_receipts")
    .select("id, created_at, amount_paid, invoice_id")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true });

  const invList = invRecs ?? [];
  const invIds = [...new Set(invList.map((r) => r.invoice_id as string))];

  const { data: invs } = invIds.length
    ? await supabase.from("billing_invoices").select("id, description, amount, student_id").in("id", invIds)
    : { data: [] as InvoiceLite[] };

  const invById = Object.fromEntries(
    ((invs ?? []) as InvoiceLite[]).map((i) => [i.id, i]),
  );
  const invStudIds = [...new Set(((invs ?? []) as InvoiceLite[]).map((i) => i.student_id))];

  const { data: invProfs } = invStudIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", invStudIds)
    : { data: [] as ProfileLite[] };

  const invNameById = Object.fromEntries(
    ((invProfs ?? []) as ProfileLite[]).map((p) => [
      p.id,
      formatProfileSnakeSurnameFirst(p),
    ]),
  );

  const allEmpty = efRowsWithUrls.length === 0 && payEnriched.length === 0 && invList.length === 0;

  return (
    <div className="space-y-8">
      {allEmpty ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          {dict.none}
        </p>
      ) : null}

      {/* Enrollment fee receipts */}
      {efRowsWithUrls.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
            {enrollmentFeeQueueDict.title}
          </h2>
          <ul className="space-y-3">
            {efRowsWithUrls.map((row) => {
              const section = Array.isArray(row.academic_sections)
                ? row.academic_sections[0]
                : row.academic_sections;
              return (
                <EnrollmentFeeReceiptQueueRow
                  key={row.id}
                  locale={locale}
                  enrollmentId={row.id}
                  studentId={row.student_id}
                  studentName={efNameById[row.student_id] ?? row.student_id}
                  sectionName={section?.name ?? "—"}
                  signedUrl={row.signedUrl}
                  uploadedAt={row.enrollment_fee_receipt_uploaded_at ?? new Date().toISOString()}
                  dict={enrollmentFeeQueueDict}
                />
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Monthly payment receipts */}
      {payEnriched.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
            {dict.title}
          </h2>
          <ul className="space-y-4">
            {payEnriched.map((r) => (
              <PaymentReviewRow
                key={r.id as string}
                locale={locale}
                paymentId={r.id as string}
                studentLabel={payNameById[r.student_id as string] ?? String(r.student_id)}
                periodLabel={`${r.month}/${r.year}`}
                amountLabel={String(r.amount ?? emptyValue)}
                previewUrl={r.signed}
                labels={dict}
                emptyValue={emptyValue}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <FinancePaymentsInvoiceReceiptsBlock
        invList={invList as unknown as FinancePaymentsInvoiceReceiptsBlockProps["invList"]}
        invById={invById}
        invNameById={invNameById}
        portalBillingDict={portalBillingDict}
        receiptHrefBase={receiptHrefBase}
      />
    </div>
  );
}
