import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary, Locale } from "@/types/i18n";
import { receiptSignedUrlForAdmin } from "@/lib/payments/receiptSignedUrl";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { FinanceInboxClient } from "./FinanceInboxClient";

interface ProfileLite {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export interface MonthlyReceiptItem {
  id: string;
  studentName: string;
  periodLabel: string;
  amount: number | null;
  signedUrl: string | null;
  studentId: string;
  uploadedAt: string;
}

export interface EnrollmentReceiptItem {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  sectionName: string;
  signedUrl: string | null;
  uploadedAt: string;
}

export interface InvoiceReceiptItem {
  receiptId: string;
  invoiceDescription: string;
  amountPaid: number;
  studentName: string;
  createdAt: string;
  receiptHref: string;
}

export interface FinanceInboxPanelProps {
  supabase: SupabaseClient;
  locale: Locale;
  dict: Dictionary;
  receiptHrefBase: string;
  activeType?: string;
}

export async function FinanceInboxPanel({
  supabase,
  locale,
  dict,
  receiptHrefBase,
  activeType,
}: FinanceInboxPanelProps) {
  const [efResult, payResult, invResult] = await Promise.all([
    loadEnrollmentFeeQueue(supabase),
    loadMonthlyQueue(supabase),
    loadInvoiceQueue(supabase, receiptHrefBase),
  ]);

  return (
    <FinanceInboxClient
      monthlyItems={payResult}
      enrollmentItems={efResult}
      invoiceItems={invResult}
      locale={locale}
      dict={dict}
      activeType={activeType}
    />
  );
}

async function loadMonthlyQueue(
  supabase: SupabaseClient,
): Promise<MonthlyReceiptItem[]> {
  const { data: payRows } = await supabase
    .from("payments")
    .select("id, student_id, month, year, amount, receipt_url, status, created_at")
    .eq("status", "pending")
    .not("receipt_url", "is", null)
    .order("created_at", { ascending: true })
    .limit(80);

  const payList = payRows ?? [];
  if (payList.length === 0) return [];

  const studIds = [...new Set(payList.map((r) => r.student_id as string))];
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", studIds);
  const nameById = Object.fromEntries(
    ((profs ?? []) as ProfileLite[]).map((p) => [
      p.id,
      formatProfileSnakeSurnameFirst(p),
    ]),
  );

  return Promise.all(
    payList.map(async (r) => ({
      id: r.id as string,
      studentName: nameById[r.student_id as string] ?? String(r.student_id),
      periodLabel: `${r.month}/${r.year}`,
      amount: r.amount as number | null,
      signedUrl: r.receipt_url
        ? await receiptSignedUrlForAdmin(r.receipt_url as string)
        : null,
      studentId: r.student_id as string,
      uploadedAt: (r.created_at as string) ?? new Date().toISOString(),
    })),
  );
}

async function loadEnrollmentFeeQueue(
  supabase: SupabaseClient,
): Promise<EnrollmentReceiptItem[]> {
  const { data: efRawRows } = await supabase
    .from("section_enrollments")
    .select(
      "id, student_id, enrollment_fee_receipt_url, enrollment_fee_receipt_uploaded_at, academic_sections(name)",
    )
    .eq("enrollment_fee_receipt_status", "pending")
    .not("enrollment_fee_receipt_url", "is", null)
    .order("enrollment_fee_receipt_uploaded_at", { ascending: true });

  const efRows = efRawRows ?? [];
  if (efRows.length === 0) return [];

  const studIds = [...new Set(efRows.map((r) => r.student_id as string))];
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", studIds);
  const nameById = Object.fromEntries(
    ((profs ?? []) as ProfileLite[]).map((p) => [
      p.id,
      formatProfileSnakeSurnameFirst(p),
    ]),
  );

  return Promise.all(
    efRows.map(async (row: Record<string, unknown>) => {
      const path = row.enrollment_fee_receipt_url as string | null;
      let signedUrl: string | null = null;
      if (path) {
        const { data } = await supabase.storage
          .from("payment-receipts")
          .createSignedUrl(path, 3600);
        signedUrl = data?.signedUrl ?? null;
      }
      const sections = row.academic_sections as
        | { name: string }
        | { name: string }[]
        | null;
      const sectionName = Array.isArray(sections)
        ? sections[0]?.name ?? "—"
        : sections?.name ?? "—";

      return {
        enrollmentId: row.id as string,
        studentId: row.student_id as string,
        studentName: nameById[row.student_id as string] ?? String(row.student_id),
        sectionName,
        signedUrl,
        uploadedAt:
          (row.enrollment_fee_receipt_uploaded_at as string) ??
          new Date().toISOString(),
      };
    }),
  );
}

async function loadInvoiceQueue(
  supabase: SupabaseClient,
  receiptHrefBase: string,
): Promise<InvoiceReceiptItem[]> {
  const { data: invRecs } = await supabase
    .from("billing_receipts")
    .select("id, created_at, amount_paid, invoice_id")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true });

  const invList = invRecs ?? [];
  if (invList.length === 0) return [];

  const invIds = [
    ...new Set(invList.map((r) => r.invoice_id as string)),
  ];
  const { data: invs } = await supabase
    .from("billing_invoices")
    .select("id, description, amount, student_id")
    .in("id", invIds);

  interface InvLite {
    id: string;
    description: string;
    amount: number;
    student_id: string;
  }
  const invById = Object.fromEntries(
    ((invs ?? []) as InvLite[]).map((i) => [i.id, i]),
  );

  const studIds = [
    ...new Set(((invs ?? []) as InvLite[]).map((i) => i.student_id)),
  ];
  const { data: profs } = studIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", studIds)
    : { data: [] as ProfileLite[] };
  const nameById = Object.fromEntries(
    ((profs ?? []) as ProfileLite[]).map((p) => [
      p.id,
      formatProfileSnakeSurnameFirst(p),
    ]),
  );

  return invList.map((r) => {
    const inv = invById[r.invoice_id as string];
    return {
      receiptId: r.id as string,
      invoiceDescription: inv?.description ?? "—",
      amountPaid: (r.amount_paid as number) ?? 0,
      studentName: inv
        ? nameById[inv.student_id] ?? String(inv.student_id)
        : "—",
      createdAt: (r.created_at as string) ?? new Date().toISOString(),
      receiptHref: `${receiptHrefBase}/${r.id}`,
    };
  });
}
