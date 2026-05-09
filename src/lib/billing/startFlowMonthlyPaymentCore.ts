import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveStudentPaymentSlot } from "@/lib/billing/resolveStudentPaymentSlot";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
import { loadFlowChileCredentialsPlain, flowChileApiBase } from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { flowCreatePaymentOrder } from "@/lib/payment-gateways/flow/flowCreatePaymentOrder";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import type { Buffer } from "node:buffer";

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
}): Promise<StartFlowMonthlyPaymentCoreResult> {
  const slot = await resolveStudentPaymentSlot(input.supabase, {
    studentId: input.studentId,
    sectionId: input.sectionId,
    month: input.month,
    year: input.year,
    fallbackAmount: input.fallbackAmount,
  });

  if (!slot.ok) {
    return { ok: false, code: "slot" };
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

  const created = await flowCreatePaymentOrder({
    apiBaseUrl: flowChileApiBase(creds),
    apiKey: creds.apiKey,
    secretKey: creds.secretKey,
    commerceOrder: paymentId,
    subject: input.subject,
    currency: "CLP",
    amount: amountForFlow,
    email: input.payerEmail,
    urlConfirmation,
    urlReturn,
    optionalJson: {
      studentId: input.studentId,
      year: String(input.year),
      month: String(input.month),
    },
  });

  if (!created.ok) {
    return { ok: false, code: "flow_error" };
  }

  const redirectUrl = `${created.url}?token=${encodeURIComponent(created.token)}`;
  return { ok: true, redirectUrl };
}
