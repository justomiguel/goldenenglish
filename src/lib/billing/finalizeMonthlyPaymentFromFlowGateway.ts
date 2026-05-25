import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { auditFinanceAction } from "@/lib/audit";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
import type { FlowFetchStatusResult, FlowStatusPayload } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";
import { flowFetchPaymentStatus } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";
import { notifyMonthlyPaymentDecision } from "@/lib/email/billingPaymentEmails";
import { revalidateStudentBillingPaths } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { lookupPaymentRowForFlowFinalize } from "@/lib/billing/lookupPaymentRowForFlowFinalize";
import { upsertFlowFinalizeRecord } from "@/lib/billing/upsertFlowFinalizeRecord";
import type { Locale } from "@/types/i18n";
import { defaultLocale } from "@/lib/i18n/dictionaries";

const FLOW_PAID_STATUS = 2;

function amountsMatchForCurrency(expected: number, fromFlow: number, currencyUpper: string): boolean {
  if (currencyUpper === "CLP") {
    return Math.round(expected) === Math.round(fromFlow);
  }
  return Math.abs(expected - fromFlow) < 0.015;
}

/**
 * Confirms a monthly `payments` row after Flow reports success (getStatus unless snapshot).
 * Idempotent; intended for Flow webhook + browser return handler.
 */
export async function finalizeMonthlyPaymentFromFlowGateway(input: {
  admin: SupabaseClient;
  apiBaseUrl: string;
  apiKey: string;
  secretKey: string;
  token: string;
  /** When set after a successful resolver getStatus paid check, skips a second Flow hop (avoids races/transient failures). */
  flowPaidSnapshot?: FlowStatusPayload;
}): Promise<{
  ok: boolean;
  skipped?: string;
  approved?: boolean;
  paymentId?: string;
}> {
  const status: FlowFetchStatusResult =
    input.flowPaidSnapshot !== undefined
      ? { ok: true, data: input.flowPaidSnapshot }
      : await flowFetchPaymentStatus({
          apiBaseUrl: input.apiBaseUrl,
          apiKey: input.apiKey,
          secretKey: input.secretKey,
          token: input.token,
        });

  if (!status.ok) {
    logServerException("finalizeMonthlyPaymentFromFlowGateway:getStatus", new Error(status.error));
    return { ok: false };
  }

  if (status.data.status !== FLOW_PAID_STATUS) {
    return { ok: true, skipped: `flow_status_${status.data.status}` };
  }

  const commerceOrder = status.data.commerceOrder?.trim() ?? "";
  const { payRow, error: lookupErr, skipReason } = await lookupPaymentRowForFlowFinalize(
    input.admin,
    commerceOrder,
  );

  if (skipReason === "invalid_commerce_order") {
    return { ok: true, skipped: "invalid_commerce_order" };
  }

  if (lookupErr) {
    logSupabaseClientError("finalizeMonthlyPaymentFromFlowGateway:lookup", lookupErr ?? {}, {
      commerceOrder,
    });
    return { ok: true, skipped: "payment_not_found" };
  }

  if (!payRow) {
    logSupabaseClientError("finalizeMonthlyPaymentFromFlowGateway:select", {}, {
      commerceOrder,
    });
    return { ok: true, skipped: "payment_not_found" };
  }

  const st = String(payRow.status);
  if (st === "approved") {
    /** Guarantee a finalize record exists even when the original transition pre-dated this table. */
    await upsertFlowFinalizeRecord({
      admin: input.admin,
      paymentId: payRow.id as string,
      snapshot: status.data,
    });
    return { ok: true, approved: true, paymentId: payRow.id as string };
  }
  if (st === "exempt") {
    return { ok: true, skipped: "exempt" };
  }
  if (st !== "pending" && st !== "rejected") {
    return { ok: true, skipped: `bad_status_${st}` };
  }

  const sectionId = payRow.section_id as string | null;
  if (!sectionId) {
    return { ok: true, skipped: "no_section_id" };
  }

  const studentId = payRow.student_id as string;
  const month = Number(payRow.month);
  const year = Number(payRow.year);

  const plan = await resolveSectionPlanMonthlyAmount(
    input.admin,
    studentId,
    sectionId,
    year,
    month,
  );
  if (plan.code !== "ok") {
    return { ok: true, skipped: `plan_${plan.code}` };
  }

  const curPlan = plan.currency.trim().toUpperCase();
  const curFlow = status.data.currency.trim().toUpperCase();
  if (curPlan !== curFlow) {
    logServerException(
      "finalizeMonthlyPaymentFromFlowGateway:currency_mismatch",
      new Error(`${curPlan} vs ${curFlow}`),
      { paymentId: payRow.id },
    );
    return { ok: true, skipped: "currency_mismatch" };
  }

  if (!amountsMatchForCurrency(plan.amount, status.data.amount, curPlan)) {
    logServerException(
      "finalizeMonthlyPaymentFromFlowGateway:amount_mismatch",
      new Error(`${plan.amount} vs ${status.data.amount}`),
      { paymentId: payRow.id },
    );
    return { ok: true, skipped: "amount_mismatch" };
  }

  const flowAmount = status.data.amount;
  const beforeStatus = st;
  const beforeAmount = payRow.amount;

  const { error: upErr } = await input.admin
    .from("payments")
    .update({
      status: "approved",
      amount: flowAmount,
      admin_notes: "flow.cl",
      gateway_provider: "flow",
    })
    .eq("id", payRow.id as string)
    .in("status", ["pending", "rejected"]);

  if (upErr) {
    logSupabaseClientError("finalizeMonthlyPaymentFromFlowGateway:update", upErr, {
      paymentId: payRow.id,
    });
    return { ok: false };
  }

  const audit = await auditFinanceAction({
    actorId: null,
    actorRole: "payment_gateway",
    action: "approve",
    resourceType: "payment",
    resourceId: payRow.id as string,
    summary: "Monthly payment approved via Flow.cl webhook",
    beforeValues: { status: beforeStatus, amount: beforeAmount },
    afterValues: { status: "approved", amount: flowAmount },
    metadata: {
      student_id: studentId,
      month,
      year,
      section_id: sectionId,
      source: "flow_cl",
      flow_order: status.data.flowOrder,
    },
  });

  if (!audit?.ok) {
    await input.admin
      .from("payments")
      .update({
        status: beforeStatus,
        amount: beforeAmount,
        admin_notes: payRow.admin_notes as string | null,
      })
      .eq("id", payRow.id as string);
    return { ok: false };
  }

  /** Persist Flow snapshot so receipts can be regenerated later with authoritative paid_at + flow_order. */
  await upsertFlowFinalizeRecord({
    admin: input.admin,
    paymentId: payRow.id as string,
    snapshot: status.data,
  });

  const loc = defaultLocale as Locale;
  void notifyMonthlyPaymentDecision({
    studentId,
    locale: loc,
    month,
    year,
    amount: flowAmount,
    currency: plan.currency,
    decision: "approved",
    adminNotes: null,
  });

  for (const l of ["en", "es"] as const) {
    revalidateStudentBillingPaths(l, studentId);
    revalidatePath(`/${l}/dashboard/admin/finance`, "layout");
    revalidatePath(`/${l}/dashboard/student/payments`);
    revalidatePath(`/${l}/dashboard/parent/payments`);
  }

  return { ok: true, approved: true, paymentId: payRow.id as string };
}
