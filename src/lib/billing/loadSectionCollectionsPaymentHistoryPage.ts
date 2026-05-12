import type { SupabaseClient } from "@supabase/supabase-js";
import { receiptSignedUrlForAdmin } from "@/lib/payments/receiptSignedUrl";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type {
  SectionCollectionsFlowFinalizeSummary,
  SectionCollectionsPaymentHistoryRow,
} from "@/types/sectionCollectionsTabs";

const MAX_PAGE_SIZE = 50;

export interface LoadSectionCollectionsPaymentHistoryPageInput {
  page: number;
  pageSize: number;
}

export interface LoadSectionCollectionsPaymentHistoryPageResult {
  rows: SectionCollectionsPaymentHistoryRow[];
  total: number;
}

export async function loadSectionCollectionsPaymentHistoryPage(
  supabase: SupabaseClient,
  sectionId: string,
  input: LoadSectionCollectionsPaymentHistoryPageInput,
): Promise<LoadSectionCollectionsPaymentHistoryPageResult> {
  const pageSize = Math.min(Math.max(1, input.pageSize), MAX_PAGE_SIZE);
  const page = Math.max(1, input.page);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const countQuery = supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("section_id", sectionId);

  const { count, error: countErr } = await countQuery;
  if (countErr) throw countErr;

  const total = count ?? 0;

  const { data: paymentRows, error: payErr } = await supabase
    .from("payments")
    .select(
      "id, student_id, month, year, amount, status, receipt_url, admin_notes, updated_at",
    )
    .eq("section_id", sectionId)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (payErr) throw payErr;

  const payments = (paymentRows ?? []) as Array<{
    id: string;
    student_id: string;
    month: number;
    year: number;
    amount: unknown;
    status: string;
    receipt_url: string | null;
    admin_notes: string | null;
    updated_at: string;
  }>;

  const studentIds = [...new Set(payments.map((p) => p.student_id))];
  const nameById = new Map<string, string>();

  if (studentIds.length > 0) {
    const { data: profs, error: profErr } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", studentIds);
    if (profErr) throw profErr;
    for (const r of profs ?? []) {
      const id = r.id as string;
      nameById.set(
        id,
        formatProfileNameSurnameFirst(
          (r.first_name as string | null) ?? "",
          (r.last_name as string | null) ?? "",
        ),
      );
    }
  }

  /**
   * Resolve Flow finalize records (1:1 by payment_id, admin-only via RLS) so the history can
   * surface fee / net / settlement metadata when the payment came through Flow.cl. Empty when
   * none of the payments in this page were paid online.
   */
  const flowById = await loadFlowFinalizeMapForPayments(
    supabase,
    payments.map((p) => p.id),
  );

  const rows: SectionCollectionsPaymentHistoryRow[] = await Promise.all(
    payments.map(async (payment) => ({
      id: payment.id,
      studentId: payment.student_id,
      studentDisplayName: nameById.get(payment.student_id) ?? payment.student_id,
      month: payment.month,
      year: payment.year,
      amount: payment.amount != null ? Number(payment.amount) : null,
      status: payment.status,
      admin_notes: payment.admin_notes,
      updated_at: payment.updated_at,
      receiptSignedUrl: payment.receipt_url
        ? await receiptSignedUrlForAdmin(payment.receipt_url)
        : null,
      flowFinalize: flowById.get(payment.id) ?? null,
    })),
  );

  return { rows, total };
}

interface FlowFinalizeRow {
  payment_id: string;
  flow_order: number | string;
  commerce_order: string;
  currency: string;
  amount: number | string;
  paid_at: string;
  payer_email: string | null;
  media_label: string | null;
  fee: number | string | null;
  balance: number | string | null;
  transfer_date: string | null;
  conversion_rate: number | string | null;
  conversion_date: string | null;
}

async function loadFlowFinalizeMapForPayments(
  supabase: SupabaseClient,
  paymentIds: string[],
): Promise<Map<string, SectionCollectionsFlowFinalizeSummary>> {
  if (paymentIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("payment_flow_finalize_records")
    .select(
      "payment_id, flow_order, commerce_order, currency, amount, paid_at, payer_email, media_label, fee, balance, transfer_date, conversion_rate, conversion_date",
    )
    .in("payment_id", paymentIds);

  if (error) throw error;

  const map = new Map<string, SectionCollectionsFlowFinalizeSummary>();
  for (const r of (data ?? []) as FlowFinalizeRow[]) {
    map.set(r.payment_id, {
      flowOrder: Number(r.flow_order),
      commerceOrder: r.commerce_order,
      currency: r.currency,
      amount: Number(r.amount),
      paidAt: r.paid_at,
      payerEmail: r.payer_email,
      mediaLabel: r.media_label,
      fee: r.fee != null ? Number(r.fee) : null,
      balance: r.balance != null ? Number(r.balance) : null,
      transferDate: r.transfer_date,
      conversionRate: r.conversion_rate != null ? Number(r.conversion_rate) : null,
      conversionDate: r.conversion_date,
    });
  }
  return map;
}
