import type { SupabaseClient } from "@supabase/supabase-js";
import { auditFinanceAction } from "@/lib/audit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type {
  ExistingMonthlyPaymentRow,
  UpsertApprovedMonthlyPaymentResult,
} from "@/lib/billing/upsertApprovedMonthlyPaymentSupport";

interface MonthlyGatewayPaymentAuditInput {
  admin: SupabaseClient;
  studentId: string;
  sectionId: string;
  month: number;
  year: number;
  gatewayAmount: number;
  gatewayProvider: "mercadopago" | "flow";
  source: string;
  gatewayPaymentRef?: string | number | null;
  parentId?: string | null;
  noteLabel: string;
  planCurrency: string;
}

interface PromoteExistingMonthlyGatewayPaymentInput
  extends MonthlyGatewayPaymentAuditInput {
  row: ExistingMonthlyPaymentRow;
}

function approvedResult(
  input: MonthlyGatewayPaymentAuditInput,
  paymentId: string,
  alreadyApproved: boolean,
): UpsertApprovedMonthlyPaymentResult {
  return {
    ok: true,
    approved: true,
    paymentId,
    studentId: input.studentId,
    sectionId: input.sectionId,
    month: input.month,
    year: input.year,
    amount: input.gatewayAmount,
    currency: input.planCurrency,
    alreadyApproved,
  };
}

async function auditMonthlyGatewayApproval(
  input: MonthlyGatewayPaymentAuditInput,
  paymentId: string,
  action: "create" | "approve",
  beforeStatus: string | null,
  beforeAmount: number | null,
): Promise<boolean> {
  const audit = await auditFinanceAction({
    actorId: null,
    actorRole: "payment_gateway",
    action,
    resourceType: "payment",
    resourceId: paymentId,
    summary: `Monthly payment approved via ${input.noteLabel} (deferred creation)`,
    beforeValues: { status: beforeStatus, amount: beforeAmount },
    afterValues: { status: "approved", amount: input.gatewayAmount },
    metadata: {
      student_id: input.studentId,
      section_id: input.sectionId,
      month: input.month,
      year: input.year,
      source: input.source,
      gateway_provider: input.gatewayProvider,
      gateway_payment_ref:
        input.gatewayPaymentRef != null ? String(input.gatewayPaymentRef) : null,
    },
  });
  return Boolean(audit?.ok);
}

export async function promoteExistingMonthlyGatewayPayment(
  input: PromoteExistingMonthlyGatewayPaymentInput,
): Promise<UpsertApprovedMonthlyPaymentResult> {
  const { admin, row } = input;
  const st = String(row.status);
  if (st === "approved") return approvedResult(input, row.id, true);
  if (st === "exempt") return { ok: true, skipped: "exempt" };
  if (st !== "pending" && st !== "rejected") {
    return { ok: true, skipped: `bad_status_${st}` };
  }

  const beforeAmount = row.amount != null ? Number(row.amount) : null;
  const { error: upErr } = await admin
    .from("payments")
    .update({
      status: "approved",
      amount: input.gatewayAmount,
      admin_notes: row.admin_notes ? `${row.admin_notes} | ${input.noteLabel}` : input.noteLabel,
      gateway_provider: input.gatewayProvider,
      ...(input.parentId ? { parent_id: input.parentId } : {}),
    })
    .eq("id", row.id)
    .in("status", ["pending", "rejected"]);
  if (upErr) {
    logSupabaseClientError("upsertApprovedMonthlyPaymentCore:update", upErr, {
      paymentId: row.id,
    });
    return { ok: false };
  }

  const audited = await auditMonthlyGatewayApproval(
    input,
    row.id,
    "approve",
    st,
    beforeAmount,
  );
  if (!audited) {
    await admin
      .from("payments")
      .update({
        status: st,
        amount: beforeAmount,
        admin_notes: row.admin_notes,
        gateway_provider: null,
      })
      .eq("id", row.id);
    return { ok: false };
  }
  return approvedResult(input, row.id, false);
}

export async function auditNewMonthlyGatewayPayment(
  input: MonthlyGatewayPaymentAuditInput,
  paymentId: string,
): Promise<boolean> {
  return auditMonthlyGatewayApproval(input, paymentId, "create", null, null);
}
