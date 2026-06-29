import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { auditFinanceAction } from "@/lib/audit";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
import type { MercadoPagoPaymentPayload } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";
import { mercadoPagoGetPayment } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";
import { notifyMonthlyPaymentDecision } from "@/lib/email/billingPaymentEmails";
import { revalidateStudentBillingPaths } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { upsertMpFinalizeRecord } from "@/lib/billing/upsertMpFinalizeRecord";
import { resolveUserLocale } from "@/lib/i18n/resolveUserLocale";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { sanitizeAnalyticsMetadata } from "@/lib/analytics/sanitizeMetadata";
import { parseMonthlyGatewayReference } from "@/lib/billing/parseMonthlyGatewayReference";
import { finalizeMercadoPagoMonthlySlot } from "@/lib/billing/finalizeMercadoPagoMonthlySlot";

const MP_APPROVED = "approved";

function amountsMatchForCurrency(expected: number, fromMp: number, currencyUpper: string): boolean {
  if (currencyUpper === "CLP" || currencyUpper === "ARS") {
    return Math.round(expected) === Math.round(fromMp);
  }
  return Math.abs(expected - fromMp) < 0.015;
}

async function loadPaymentByExternalReference(
  admin: SupabaseClient,
  externalReference: string,
): Promise<Record<string, unknown> | null> {
  const id = externalReference.trim();
  if (!id) return null;
  const { data, error } = await admin.from("payments").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

/**
 * Confirms a monthly `payments` row after MercadoPago reports success.
 */
export async function finalizeMercadoPagoPayment(input: {
  admin: SupabaseClient;
  accessToken: string;
  mpPaymentId: string | number;
  /** When set, skips GET payment (return-bridge path). */
  mpPaidSnapshot?: MercadoPagoPaymentPayload;
}): Promise<{
  ok: boolean;
  skipped?: string;
  approved?: boolean;
  paymentId?: string;
}> {
  const fetched =
    input.mpPaidSnapshot !== undefined
      ? { ok: true as const, data: input.mpPaidSnapshot }
      : await mercadoPagoGetPayment({
          accessToken: input.accessToken,
          paymentId: input.mpPaymentId,
        });

  if (!fetched.ok) {
    logServerException("finalizeMercadoPagoPayment:getPayment", new Error(fetched.error));
    return { ok: false };
  }

  const snapshot = fetched.data;
  if (snapshot.status !== MP_APPROVED) {
    return { ok: true, skipped: `mp_status_${snapshot.status}` };
  }

  const externalRef = snapshot.external_reference?.trim() ?? "";
  const ref = parseMonthlyGatewayReference(externalRef);
  if (!ref) {
    return { ok: true, skipped: "payment_not_found" };
  }

  // Deferred creation: a `tuition:` slot reference has no pre-existing row.
  if (ref.kind === "slot") {
    return finalizeMercadoPagoMonthlySlot({
      admin: input.admin,
      slot: ref.slot,
      snapshot,
    });
  }

  const payRow = await loadPaymentByExternalReference(input.admin, ref.paymentId);
  if (!payRow) {
    return { ok: true, skipped: "payment_not_found" };
  }

  const st = String(payRow.status);
  if (st === "approved") {
    const prefId = String(payRow.mp_preference_id ?? snapshot.external_reference ?? "");
    await upsertMpFinalizeRecord({
      admin: input.admin,
      paymentId: payRow.id as string,
      preferenceId: prefId || "unknown",
      snapshot,
    });
    return { ok: true, approved: true, paymentId: payRow.id as string };
  }
  if (st === "exempt") return { ok: true, skipped: "exempt" };
  if (st !== "pending" && st !== "rejected") {
    return { ok: true, skipped: `bad_status_${st}` };
  }

  const sectionId = payRow.section_id as string | null;
  if (!sectionId) return { ok: true, skipped: "no_section_id" };

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
  if (plan.code !== "ok") return { ok: true, skipped: `plan_${plan.code}` };

  const curPlan = plan.currency.trim().toUpperCase();
  const curMp = snapshot.currency_id.trim().toUpperCase();
  if (curPlan !== curMp) {
    logServerException(
      "finalizeMercadoPagoPayment:currency_mismatch",
      new Error(`${curPlan} vs ${curMp}`),
      { paymentId: payRow.id },
    );
    return { ok: true, skipped: "currency_mismatch" };
  }

  if (!amountsMatchForCurrency(plan.amount, snapshot.transaction_amount, curPlan)) {
    logServerException(
      "finalizeMercadoPagoPayment:amount_mismatch",
      new Error(`${plan.amount} vs ${snapshot.transaction_amount}`),
      { paymentId: payRow.id },
    );
    return { ok: true, skipped: "amount_mismatch" };
  }

  const mpAmount = snapshot.transaction_amount;
  const beforeStatus = st;
  const beforeAmount = Number(payRow.amount);

  const { error: upErr } = await input.admin
    .from("payments")
    .update({
      status: "approved",
      amount: mpAmount,
      admin_notes: payRow.admin_notes
        ? `${payRow.admin_notes} | mercadopago`
        : "mercadopago",
      gateway_provider: "mercadopago",
    })
    .eq("id", payRow.id as string)
    .in("status", ["pending", "rejected"]);

  if (upErr) {
    logSupabaseClientError("finalizeMercadoPagoPayment:update", upErr, {
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
    summary: "Monthly payment approved via MercadoPago webhook",
    beforeValues: { status: beforeStatus, amount: beforeAmount },
    afterValues: { status: "approved", amount: mpAmount },
    metadata: {
      student_id: studentId,
      month,
      year,
      section_id: sectionId,
      source: "mercadopago",
      mp_payment_id: snapshot.id,
    },
  });

  if (!audit?.ok) {
    await input.admin
      .from("payments")
      .update({
        status: beforeStatus,
        amount: beforeAmount,
        admin_notes: payRow.admin_notes as string | null,
        gateway_provider: null,
      })
      .eq("id", payRow.id as string);
    return { ok: false };
  }

  const preferenceId = String(payRow.mp_preference_id ?? "");
  await upsertMpFinalizeRecord({
    admin: input.admin,
    paymentId: payRow.id as string,
    preferenceId: preferenceId || String(snapshot.id),
    snapshot,
  });

  void input.admin.from("user_events").insert({
    user_id: studentId,
    event_type: "action" as const,
    entity: AnalyticsEntity.monthlyPaymentMercadoPagoCompleted,
    metadata: sanitizeAnalyticsMetadata({
      month,
      year,
      section_id: sectionId,
      mp_payment_id: String(snapshot.id),
      payment_id: payRow.id,
    }),
  });

  const loc = await resolveUserLocale(input.admin, studentId);
  void notifyMonthlyPaymentDecision({
    studentId,
    locale: loc,
    month,
    year,
    amount: mpAmount,
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
