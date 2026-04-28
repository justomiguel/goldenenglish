import "server-only";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";
import { EnrollmentFeeReceiptQueueRow } from "./EnrollmentFeeReceiptQueueRow";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export interface FinanceReceiptsPanelProps {
  supabase: SupabaseClient;
  locale: Locale;
  dict: Dictionary["dashboard"]["portalBilling"];
  enrollmentFeeQueueDict: Dictionary["admin"]["finance"]["enrollmentFeeQueue"];
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

interface EnrollmentFeeReceiptRow {
  id: string;
  student_id: string;
  enrollment_fee_receipt_url: string | null;
  enrollment_fee_receipt_uploaded_at: string | null;
  academic_sections: { name: string } | { name: string }[] | null;
}

export async function FinanceReceiptsPanel({
  supabase,
  locale,
  dict,
  enrollmentFeeQueueDict,
  receiptHrefBase,
}: FinanceReceiptsPanelProps) {
  // ── Invoice receipts (billing_receipts) ─────────────────────────────────
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
      formatProfileSnakeSurnameFirst(p),
    ]),
  );

  // ── Enrollment fee receipts (section_enrollments) ────────────────────────
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
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", efStudIds)
    : { data: [] as ProfileLite[] };

  const efNameById = Object.fromEntries(
    ((efProfs ?? []) as ProfileLite[]).map((p) => [
      p.id,
      formatProfileSnakeSurnameFirst(p),
    ]),
  );

  // Generate signed URLs for each enrollment fee receipt
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

  return (
    <div className="space-y-8">
      {/* Enrollment fee receipts section */}
      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
            {enrollmentFeeQueueDict.title}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {enrollmentFeeQueueDict.lead}
          </p>
        </header>
        {efRowsWithUrls.length === 0 ? (
          <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
            {enrollmentFeeQueueDict.empty}
          </p>
        ) : (
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
        )}
      </section>

      {/* Invoice receipts section (billing_receipts) */}
      <section className="space-y-4">
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
      </section>
    </div>
  );
}
