import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudentPaymentSlotFailureReason } from "@/lib/billing/resolveStudentPaymentSlot";
import { validateStudentSectionMonthlySlot } from "@/lib/billing/validateStudentSectionMonthlySlot";
import { loadFlowChileCredentialsPlain, flowChileApiBase } from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { flowCreatePaymentOrder } from "@/lib/payment-gateways/flow/flowCreatePaymentOrder";
import { extractFlowMinimumClpFromCreateError } from "@/lib/payment-gateways/flow/parseFlowCreatePaymentError";
import { reservePaymentFlowCommerceReferenceForSlot } from "@/lib/payment-gateways/flow/reservePaymentFlowCommerceReference";
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
        | "flow_error"
        | "flow_amount_below_minimum";
      /** When `code === "slot"`, why {@link resolveStudentPaymentSlot} failed. */
      slotReason?: StudentPaymentSlotFailureReason;
      /** Present when Flow returns code 1901 (minimum CLP amount). */
      flowMinClp?: number;
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
  // Deferred creation: validate the billing slot only. No `payments` row is
  // created here — the row is materialized as `approved` on gateway confirmation.
  const validation = await validateStudentSectionMonthlySlot(input.supabase, {
    studentId: input.studentId,
    sectionId: input.sectionId,
    month: input.month,
    year: input.year,
  });

  if (!validation.ok) {
    return { ok: false, code: "slot", slotReason: validation.reason };
  }

  const effective = validation.effectiveAmount;

  const creds = await loadFlowChileCredentialsPlain(input.admin, input.encryptionKey32);
  if (!creds?.enabled) {
    return { ok: false, code: "no_credentials" };
  }

  const cur = validation.currency.trim().toUpperCase();
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

  const reserved = await reservePaymentFlowCommerceReferenceForSlot(input.admin, {
    studentId: input.studentId,
    sectionId: input.sectionId,
    year: input.year,
    month: input.month,
    parentId: input.tutorParentId ?? null,
  });
  if (!reserved.ok) {
    logServerActionInvariantViolation(
      "startFlowMonthlyPaymentCore:reserveCommerceRef",
      "rpc_failed",
      { student_id: input.studentId, section_id: input.sectionId },
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
    const minParsed = extractFlowMinimumClpFromCreateError(created.error);
    if (minParsed != null) {
      logServerActionInvariantViolation("startFlowMonthlyPaymentCore:flowCreatePaymentOrder", created.error, {
        commerce_ref: reserved.commerceRef,
        month: input.month,
        year: input.year,
        section_id: input.sectionId,
        branch: "flow_minimum_amount_clp",
        flow_min_clp: minParsed,
      });
      return { ok: false, code: "flow_amount_below_minimum", flowMinClp: minParsed };
    }
    logServerActionInvariantViolation("startFlowMonthlyPaymentCore:flowCreatePaymentOrder", created.error, {
      commerce_ref: reserved.commerceRef,
      month: input.month,
      year: input.year,
      section_id: input.sectionId,
    });
    return { ok: false, code: "flow_error" };
  }

  const redirectUrl = `${created.url}?token=${encodeURIComponent(created.token)}`;
  return { ok: true, redirectUrl };
}
