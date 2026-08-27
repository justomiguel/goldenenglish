import type { SupabaseClient } from "@supabase/supabase-js";
import type { Buffer } from "node:buffer";
import { validateStudentSectionMonthlySlot } from "@/lib/billing/validateStudentSectionMonthlySlot";
import { insertMonthlyCheckoutBundle } from "@/lib/billing/insertMonthlyCheckoutBundle";
import { loadFlowChileCredentialsPlain, flowChileApiBase } from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { flowCreatePaymentOrder } from "@/lib/payment-gateways/flow/flowCreatePaymentOrder";
import { extractFlowMinimumClpFromCreateError } from "@/lib/payment-gateways/flow/parseFlowCreatePaymentError";
import { reservePaymentFlowCommerceReferenceForBundle } from "@/lib/payment-gateways/flow/reservePaymentFlowCommerceReference";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { logServerActionInvariantViolation } from "@/lib/logging/serverActionLog";
import { truncateForFlowText } from "@/lib/billing/truncateFlowText";
import type { StartFlowMonthlyPaymentCoreResult } from "@/lib/billing/startFlowMonthlyPaymentCore";

export async function startFlowMonthlyBundlePaymentCore(input: {
  supabase: SupabaseClient;
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  studentId: string;
  sectionIds: string[];
  month: number;
  year: number;
  expectedTotal: number;
  currency: string;
  payerEmail: string;
  locale: string;
  subject: string;
  paymentsDashboard: "student" | "parent";
  tutorParentId: string | null;
  studentLabelForFlow: string;
  sectionLabelForFlow: string;
  periodLabelForFlow: string;
}): Promise<StartFlowMonthlyPaymentCoreResult> {
  let sum = 0;
  for (const sectionId of input.sectionIds) {
    const validation = await validateStudentSectionMonthlySlot(input.supabase, {
      studentId: input.studentId,
      sectionId,
      month: input.month,
      year: input.year,
    });
    if (!validation.ok) {
      return { ok: false, code: "slot", slotReason: validation.reason };
    }
    sum += validation.effectiveAmount;
  }

  const cur = input.currency.trim().toUpperCase();
  if (cur !== "CLP") return { ok: false, code: "clp_only" };

  const creds = await loadFlowChileCredentialsPlain(input.admin, input.encryptionKey32);
  if (!creds?.enabled) return { ok: false, code: "no_credentials" };

  const origin = getPublicSiteUrl();
  if (!origin) return { ok: false, code: "no_public_url" };

  const inserted = await insertMonthlyCheckoutBundle(input.admin, {
    studentId: input.studentId,
    parentId: input.tutorParentId,
    year: input.year,
    month: input.month,
    currency: cur,
    expectedTotal: input.expectedTotal,
    sectionIds: input.sectionIds,
  });
  if (!inserted.ok) return { ok: false, code: "flow_error" };

  const reserved = await reservePaymentFlowCommerceReferenceForBundle(input.admin, inserted.bundleId);
  if (!reserved.ok) {
    logServerActionInvariantViolation("startFlowMonthlyBundlePaymentCore:reserve", "rpc_failed", {
      student_id: input.studentId,
    });
    return { ok: false, code: "flow_error" };
  }

  const urlConfirmation = new URL("/api/payments/flow/confirm", origin).toString();
  const urlReturnBridge = new URL("/api/payments/flow/return-bridge", origin);
  urlReturnBridge.searchParams.set("locale", input.locale);
  urlReturnBridge.searchParams.set("dashboard", input.paymentsDashboard);
  const amountForFlow = Math.round(sum);
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
    urlReturn: urlReturnBridge.toString(),
    optionalJson: {
      student: truncateForFlowText(input.studentLabelForFlow, 120),
      section: truncateForFlowText(input.sectionLabelForFlow, 120),
      period: truncateForFlowText(input.periodLabelForFlow, 80),
    },
  });

  if (!created.ok) {
    const minParsed = extractFlowMinimumClpFromCreateError(created.error);
    if (minParsed != null) {
      return { ok: false, code: "flow_amount_below_minimum", flowMinClp: minParsed };
    }
    logServerActionInvariantViolation("startFlowMonthlyBundlePaymentCore:create", created.error, {
      commerce_ref: reserved.commerceRef,
    });
    return { ok: false, code: "flow_error" };
  }

  return { ok: true, redirectUrl: `${created.url}?token=${encodeURIComponent(created.token)}` };
}
