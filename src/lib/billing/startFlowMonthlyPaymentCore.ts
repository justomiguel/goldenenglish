import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveStudentPaymentSlot,
  type StudentPaymentSlotFailureReason,
} from "@/lib/billing/resolveStudentPaymentSlot";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
import { loadFlowChileCredentialsPlain, flowChileApiBase } from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { flowCreatePaymentOrder } from "@/lib/payment-gateways/flow/flowCreatePaymentOrder";
import { reservePaymentFlowCommerceReference } from "@/lib/payment-gateways/flow/reservePaymentFlowCommerceReference";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { logServerActionInvariantViolation } from "@/lib/logging/serverActionLog";
import type { Buffer } from "node:buffer";
import { truncateForFlowText } from "@/lib/billing/truncateFlowText";

export type StartFlowMonthlyPaymentCoreResult =
  | { ok: true; redirectUrl: string }
  | {
      ok: false;
      code:
        | "slot"
        | "no_credentials"
        | "clp_only"
        | "no_public_url"
        | "flow_http"
        | "flow_error";
      /** When `code === "slot"`, why {@link resolveStudentPaymentSlot} failed. */
      slotReason?: StudentPaymentSlotFailureReason;
    };

/**
 * Shared Flow checkout start for student or tutor (after authz outside).
 */
export async function startFlowMonthlyPaymentCore(input: {
  supabase: SupabaseClient;
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  studentId: string;
  sectionId: string;
  month: number;
  year: number;
  fallbackAmount: number;
  payerEmail: string;
  locale: string;
  subject: string;
  /** Dashboard segment for Flow `urlReturn`. */
  paymentsDashboard: "student" | "parent";
  /** When tutor pays for a ward, sets `payments.parent_id`. */
  tutorParentId: string | null;
  /** Human-readable labels for Flow `optional` — no identifiers. */
  studentLabelForFlow: string;
  sectionLabelForFlow: string;
  periodLabelForFlow: string;
}): Promise<StartFlowMonthlyPaymentCoreResult> {
  const slot = await resolveStudentPaymentSlot(input.supabase, {
    studentId: input.studentId,
    sectionId: input.sectionId,
    month: input.month,
    year: input.year,
    fallbackAmount: input.fallbackAmount,
    actingParentIdForInsert: input.tutorParentId ?? null,
  });

  if (!slot.ok) {
    return { ok: false, code: "slot", slotReason: slot.reason };
  }

  const paymentId = slot.payment.id;
  const effective = slot.effectiveAmount;

  if (input.tutorParentId) {
    await input.supabase
      .from("payments")
      .update({ parent_id: input.tutorParentId })
      .eq("id", paymentId)
      .eq("student_id", input.studentId)
      .in("status", ["pending", "rejected"]);
  }

  const creds = await loadFlowChileCredentialsPlain(input.admin, input.encryptionKey32);
  if (!creds?.enabled) {
    return { ok: false, code: "no_credentials" };
  }

  const plan = await resolveSectionPlanMonthlyAmount(
    input.supabase,
    input.studentId,
    input.sectionId,
    input.year,
    input.month,
  );
  if (plan.code !== "ok") {
    return { ok: false, code: "slot" };
  }
  const cur = plan.currency.trim().toUpperCase();
  if (cur !== "CLP") {
    return { ok: false, code: "clp_only" };
  }

  const amountForFlow = Math.round(effective);
  const origin = getPublicSiteUrl();
  if (!origin) {
    return { ok: false, code: "no_public_url" };
  }

  const urlConfirmation = new URL("/api/payments/flow/confirm", origin).toString();
  const urlReturnBridge = new URL("/api/payments/flow/return-bridge", origin);
  urlReturnBridge.searchParams.set("locale", input.locale);
  urlReturnBridge.searchParams.set("dashboard", input.paymentsDashboard);
  const urlReturn = urlReturnBridge.toString();

  const reserved = await reservePaymentFlowCommerceReference(input.admin, {
    paymentId,
    year: input.year,
    month: input.month,
  });
  if (!reserved.ok) {
    logServerActionInvariantViolation(
      "startFlowMonthlyPaymentCore:reserveCommerceRef",
      "rpc_failed",
      { payment_id: paymentId },
    );
    return { ok: false, code: "flow_error" };
  }

  const created = await flowCreatePaymentOrder({
    apiBaseUrl: flowChileApiBase(creds),
    apiKey: creds.apiKey,
    secretKey: creds.secretKey,
    commerceOrder: reserved.commerceRef,
    subject: input.subject,
    currency: "CLP",
    amount: amountForFlow,
    email: input.payerEmail,
    urlConfirmation,
    urlReturn,
    optionalJson: {
      student: truncateForFlowText(input.studentLabelForFlow, 120),
      section: truncateForFlowText(input.sectionLabelForFlow, 120),
      period: truncateForFlowText(input.periodLabelForFlow, 80),
    },
  });

  if (!created.ok) {
    logServerActionInvariantViolation("startFlowMonthlyPaymentCore:flowCreatePaymentOrder", created.error, {
      payment_id: paymentId,
      month: input.month,
      year: input.year,
      section_id: input.sectionId,
    });
    return { ok: false, code: "flow_error" };
  }

  const redirectUrl = `${created.url}?token=${encodeURIComponent(created.token)}`;
  return { ok: true, redirectUrl };
}
