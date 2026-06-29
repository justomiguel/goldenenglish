import type { SupabaseClient } from "@supabase/supabase-js";

export interface UpsertApprovedMonthlyPaymentInput {
  admin: SupabaseClient;
  slot: {
    studentId: string;
    sectionId: string | null;
    month: number;
    year: number;
    parentId?: string | null;
  };
  gatewayProvider: "mercadopago" | "flow";
  gatewayAmount: number;
  gatewayCurrency: string;
  /** Audit source label (`mercadopago` | `flow_cl`). */
  source: string;
  /** Gateway-side payment identifier for audit metadata (mp payment id / flow order). */
  gatewayPaymentRef?: string | number | null;
  /** Stored on `payments.mp_preference_id` when materializing a new MP row. */
  mpPreferenceId?: string | null;
}

export type UpsertApprovedMonthlyPaymentResult =
  | {
      ok: true;
      approved: true;
      paymentId: string;
      studentId: string;
      sectionId: string;
      month: number;
      year: number;
      amount: number;
      currency: string;
      alreadyApproved: boolean;
    }
  | { ok: true; skipped: string }
  | { ok: false };

/** Postgres `unique_violation`; PostgREST surfaces it on `error.code`. */
export const PG_UNIQUE_VIOLATION = "23505";

export function isUniqueViolation(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: unknown }).code === PG_UNIQUE_VIOLATION
  );
}

export function amountsMatchForCurrency(
  expected: number,
  fromGateway: number,
  currencyUpper: string,
): boolean {
  if (currencyUpper === "CLP" || currencyUpper === "ARS") {
    return Math.round(expected) === Math.round(fromGateway);
  }
  return Math.abs(expected - fromGateway) < 0.015;
}

export type ExistingMonthlyPaymentRow = {
  id: string;
  status: string;
  amount: number | string | null;
  admin_notes: string | null;
};

export async function findExistingMonthlyPaymentForSlot(
  admin: SupabaseClient,
  studentId: string,
  sectionId: string,
  month: number,
  year: number,
): Promise<{ row: ExistingMonthlyPaymentRow | null; error: unknown }> {
  const { data, error } = await admin
    .from("payments")
    .select("id, status, amount, admin_notes")
    .eq("student_id", studentId)
    .eq("section_id", sectionId)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();
  return { row: (data as ExistingMonthlyPaymentRow | null) ?? null, error };
}
