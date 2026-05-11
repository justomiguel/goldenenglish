import type { SupabaseClient } from "@supabase/supabase-js";

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Resolves Flow `commerceOrder` to a payments row (`id` UUID or `MES-*` refs). */
export async function lookupPaymentRowForFlowFinalize(
  admin: SupabaseClient,
  commerceOrderRaw: string,
): Promise<{
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
  error: unknown | null;
  skipReason?: "invalid_commerce_order";
}> {
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
      .select("payment_id")
      .eq("commerce_ref", commerceOrder)
      .maybeSingle();

    if (linkErr) {
      return { payRow: undefined, error: linkErr };
    }
    paymentId = typeof link?.payment_id === "string" ? link.payment_id : null;
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
