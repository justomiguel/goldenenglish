import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type {
  PaymentReceiptInputPayer,
  PaymentReceiptInputPayment,
  PaymentReceiptInputStudent,
  PaymentReceiptKind,
} from "@/lib/billing/buildPaymentReceiptModel";

export type PaymentReceiptLoadOutcome =
  /** Session client can't see this payment (RLS denial). Treat as 404 to avoid existence oracle. */
  | { ok: false; reason: "not_found" }
  /** Row visible but not yet `approved` — receipts are only for paid rows. */
  | { ok: false; reason: "not_paid" }
  | {
      ok: true;
      payment: PaymentReceiptInputPayment;
      payer: PaymentReceiptInputPayer;
      student: PaymentReceiptInputStudent;
    };

interface PaymentRow {
  id: string;
  parent_id: string | null;
  student_id: string;
  month: number | null;
  year: number | null;
  amount: number | null;
  status: string;
  receipt_url: string | null;
  payment_kind: string | null;
  section_id: string | null;
  gateway_provider: string | null;
  updated_at: string;
  created_at: string;
}

interface ProfileNamesRow {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

/**
 * Loads everything required to render a payment receipt for `paymentId`, applying authorization
 * via the **session** client (RLS gates student-self, parent-of-ward, admin). Denormalized lookups
 * (Flow commerce ref, section label, parent name) use the admin client only AFTER the session has
 * already proved access — never as a backdoor.
 */
export async function loadPaymentForReceipt(input: {
  supabase: SupabaseClient;
  paymentId: string;
  /** "monthly" | "enrollment" — already-localized strings for the receipt method label. */
  flowMethodLabel: string;
  mercadoPagoMethodLabel: string;
  uploadMethodLabel: string;
}): Promise<PaymentReceiptLoadOutcome> {
  const { supabase, paymentId } = input;

  const { data: row, error } = await supabase
    .from("payments")
    .select(
      "id, parent_id, student_id, month, year, amount, status, receipt_url, payment_kind, section_id, gateway_provider, updated_at, created_at",
    )
    .eq("id", paymentId)
    .maybeSingle<PaymentRow>();

  if (error || !row) return { ok: false, reason: "not_found" };
  if (row.status !== "approved") return { ok: false, reason: "not_paid" };

  const admin = createAdminClient();

  const [studentNamesRes, parentNamesRes, sectionRes, currencyRes, refRes, flowFinalizeRes, mpFinalizeRes] =
    await Promise.all([
    admin
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", row.student_id)
      .maybeSingle<ProfileNamesRow>(),
    row.parent_id
      ? admin
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", row.parent_id)
          .maybeSingle<ProfileNamesRow>()
      : Promise.resolve({ data: null, error: null }),
    row.section_id
      ? admin
          .from("academic_sections")
          .select("name")
          .eq("id", row.section_id)
          .maybeSingle<{ name: string | null }>()
      : Promise.resolve({ data: null, error: null }),
    loadBillingCurrencySetting(admin),
    admin
      .from("payment_flow_checkout_refs")
      .select("commerce_ref, created_at")
      .eq("payment_id", row.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ commerce_ref: string; created_at: string }>(),
    admin
      .from("payment_flow_finalize_records")
      .select("flow_order, paid_at, payer_email, media_label, commerce_order, currency, amount")
      .eq("payment_id", row.id)
      .maybeSingle<FlowFinalizeRecordRow>(),
    admin
      .from("payment_mp_finalize_records")
      .select("mp_payment_id, paid_at, payer_email, payment_method, currency, amount")
      .eq("payment_id", row.id)
      .maybeSingle<MpFinalizeRecordRow>(),
  ]);

  const studentRow = studentNamesRes.data;
  const parentRow = parentNamesRes.data;
  const sectionRow = sectionRes.data;
  const flowRef = refRes.data;
  const flowFinalize = flowFinalizeRes.data;
  const mpFinalize = mpFinalizeRes.data;

  const studentName = formatProfileSnakeSurnameFirst(studentRow ?? {}, "—");
  const parentName = parentRow ? formatProfileSnakeSurnameFirst(parentRow, "") : "";

  const paidByTutor = Boolean(row.parent_id) && row.parent_id !== row.student_id;
  const payerFullName = paidByTutor && parentName ? parentName : studentName;
  const profilePayerEmail = paidByTutor ? parentRow?.email ?? null : studentRow?.email ?? null;
  const payerEmail = flowFinalize?.payer_email ?? mpFinalize?.payer_email ?? profilePayerEmail;

  const paymentKind: PaymentReceiptKind = row.payment_kind === "enrollment" ? "enrollment" : "monthly";
  const gatewayProvider = row.gateway_provider?.trim().toLowerCase() ?? null;
  const isFlowPayment = gatewayProvider === "flow" || Boolean(flowRef || flowFinalize);
  const isMercadoPagoPayment =
    gatewayProvider === "mercadopago" || Boolean(mpFinalize);
  const methodLabel = composeMethodLabel({
    flowMethodLabel: input.flowMethodLabel,
    mercadoPagoMethodLabel: input.mercadoPagoMethodLabel,
    uploadMethodLabel: input.uploadMethodLabel,
    isFlowPayment,
    isMercadoPagoPayment,
    flowOrder: flowFinalize?.flow_order ?? null,
    mediaLabel: flowFinalize?.media_label ?? null,
    mpPaymentMethod: mpFinalize?.payment_method ?? null,
  });

  const receiptNumber =
    flowFinalize?.commerce_order ??
    flowRef?.commerce_ref ??
    (mpFinalize ? `MP-${mpFinalize.mp_payment_id}` : formatManualReceiptNumber(row.id));

  const paidAt = flowFinalize?.paid_at ?? mpFinalize?.paid_at ?? row.updated_at;
  const currency = flowFinalize?.currency ?? mpFinalize?.currency ?? currencyRes.currency;
  const amount = flowFinalize
    ? Number(flowFinalize.amount)
    : mpFinalize
      ? Number(mpFinalize.amount)
      : Number(row.amount ?? 0);

  return {
    ok: true,
    payment: {
      id: row.id,
      paymentKind,
      amount,
      currency,
      paidAt,
      month: row.month,
      year: row.year,
      sectionLabel: sectionRow?.name ?? null,
      methodLabel,
      receiptNumber,
    },
    payer: {
      fullName: payerFullName,
      email: payerEmail,
      paidByTutor,
    },
    student: {
      fullName: studentName,
    },
  };
}

interface FlowFinalizeRecordRow {
  flow_order: number;
  paid_at: string;
  payer_email: string | null;
  media_label: string | null;
  commerce_order: string;
  currency: string;
  amount: number;
}

interface MpFinalizeRecordRow {
  mp_payment_id: number;
  paid_at: string;
  payer_email: string | null;
  payment_method: string | null;
  currency: string;
  amount: number;
}

function composeMethodLabel(input: {
  flowMethodLabel: string;
  mercadoPagoMethodLabel: string;
  uploadMethodLabel: string;
  isFlowPayment: boolean;
  isMercadoPagoPayment: boolean;
  flowOrder: number | null;
  mediaLabel: string | null;
  mpPaymentMethod: string | null;
}): string {
  if (input.isMercadoPagoPayment) {
    const parts: string[] = [input.mercadoPagoMethodLabel];
    if (input.mpPaymentMethod) parts.push(input.mpPaymentMethod);
    return parts.join(" · ");
  }
  if (!input.isFlowPayment) return input.uploadMethodLabel;
  const parts: string[] = [input.flowMethodLabel];
  if (input.mediaLabel) parts.push(input.mediaLabel);
  if (input.flowOrder != null) parts.push(`Nº ${input.flowOrder}`);
  return parts.join(" · ");
}

/** Stable, short receipt number for non-Flow payments (admin-approved upload). */
function formatManualReceiptNumber(paymentId: string): string {
  return `REC-${paymentId.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}
