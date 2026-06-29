import type { SupabaseClient } from "@supabase/supabase-js";
import type { MonthlyPaymentSlotRef } from "@/lib/billing/parseMonthlyGatewayReference";

const PAYMENTS_SELECT_FLOW =
  "id, student_id, section_id, month, year, amount, status, admin_notes";

type PaymentRowFlowSelect = {
  id: string;
  student_id: string;
  section_id: string | null;
  month: number;
  year: number;
  amount: number | string | null;
  status: string;
  admin_notes: string | null;
};

type CheckoutRefRow = {
  payment_id: string | null;
  student_id: string | null;
  section_id: string | null;
  parent_id: string | null;
  year: number | null;
  month: number | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type FlowFinalizeLookupResult = {
  /** Legacy: an existing payments row resolved from `commerceOrder`. */
  payRow:
    | {
        id: string;
        student_id: string;
        section_id: string | null;
        month: number;
        year: number;
        amount: number | null;
        status: string;
        admin_notes: string | null;
      }
    | undefined;
  /** Deferred creation: the not-yet-materialized tuition slot the ref points at. */
  slot?: MonthlyPaymentSlotRef;
  error: unknown | null;
  skipReason?: "invalid_commerce_order";
};

/**
 * Resolves Flow `commerceOrder` to either an existing payments row (`id` UUID or a
 * legacy `MES-*` ref mapped to a `payment_id`) or a deferred tuition slot (a `MES-*`
 * ref mapped to student/section/year/month — see migration 159).
 */
export async function lookupPaymentRowForFlowFinalize(
  admin: SupabaseClient,
  commerceOrderRaw: string,
): Promise<FlowFinalizeLookupResult> {
  const commerceOrder = commerceOrderRaw.trim();
  if (!commerceOrder) {
    return { payRow: undefined, error: null, skipReason: "invalid_commerce_order" };
  }

  let paymentId: string | null = null;

  if (UUID_RE.test(commerceOrder)) {
    paymentId = commerceOrder;
  } else {
    const { data: link, error: linkErr } = await admin
      .from("payment_flow_checkout_refs")
      .select("payment_id, student_id, section_id, parent_id, year, month")
      .eq("commerce_ref", commerceOrder)
      .maybeSingle();

    if (linkErr) {
      return { payRow: undefined, error: linkErr };
    }

    const ref = (link as CheckoutRefRow | null) ?? null;
    if (ref?.payment_id && typeof ref.payment_id === "string") {
      paymentId = ref.payment_id;
    } else if (
      ref &&
      typeof ref.student_id === "string" &&
      typeof ref.section_id === "string" &&
      typeof ref.year === "number" &&
      typeof ref.month === "number"
    ) {
      return {
        payRow: undefined,
        error: null,
        slot: {
          studentId: ref.student_id,
          sectionId: ref.section_id,
          year: ref.year,
          month: ref.month,
          parentId: typeof ref.parent_id === "string" ? ref.parent_id : null,
        },
      };
    } else {
      paymentId = null;
    }
  }

  if (!paymentId) {
    return { payRow: undefined, error: null, skipReason: "invalid_commerce_order" };
  }

  const { data: payRowRaw, error: payErr } = await admin
    .from("payments")
    .select(PAYMENTS_SELECT_FLOW)
    .eq("id", paymentId)
    .maybeSingle();

  if (payErr) {
    return { payRow: undefined, error: payErr };
  }

  const pr = payRowRaw as PaymentRowFlowSelect | null;
  if (
    !pr ||
    typeof pr.id !== "string" ||
    typeof pr.student_id !== "string" ||
    typeof pr.status !== "string"
  ) {
    return { payRow: undefined, error: null };
  }

  return {
    payRow: {
      id: pr.id,
      student_id: pr.student_id,
      section_id: pr.section_id,
      month: Number(pr.month),
      year: Number(pr.year),
      amount: pr.amount !== null ? Number(pr.amount) : null,
      status: pr.status,
      admin_notes: pr.admin_notes,
    },
    error: null,
  };
}
