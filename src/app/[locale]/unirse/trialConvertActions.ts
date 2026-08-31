"use server";

import { redirect } from "next/navigation";
import { Buffer } from "node:buffer";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { planTrialConvertQuote } from "@/lib/register/planTrialConvertQuote";
import { loadTrialConvertQuoteFacts } from "@/lib/register/loadTrialConvertQuoteFacts";
import { loadFamilyBillingPolicy } from "@/lib/billing/loadFamilyBillingPolicy";
import { trialConvertCreditInput } from "@/lib/register/trialConvertCreditInput";
import { startTrialLeadGatewayCore } from "@/lib/register/startTrialLeadGatewayCore";
import { applyTrialConvertGatewayCapture } from "@/lib/register/applyTrialConvertGatewayCapture";
import { familyEmailForTrialLead } from "@/lib/register/notifyTrialSeatMails";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";

export type TrialConvertActionResult = { ok: true } | { ok: false; code: string };

const startSchema = z.object({
  locale: z.string().min(1),
  token: z.string().min(8),
  sectionIds: z.array(z.string().uuid()).min(1).max(20),
  method: z.enum(["flow", "mercadopago", "free"]),
});

export async function startTrialConvertAction(input: {
  locale: string;
  token: string;
  sectionIds: string[];
  method: "flow" | "mercadopago" | "free";
}): Promise<TrialConvertActionResult> {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("registrations")
    .select(
      "id, dni, intent, status, trial_convert_expires_at, trial_fee_captured, trial_fee_snapshot, email, tutor_email, tutor_name, first_name, last_name, birth_date",
    )
    .eq("trial_convert_token", parsed.data.token)
    .eq("intent", "trial")
    .maybeSingle();
  if (error || !lead) return { ok: false, code: "not_found" };
  const expires = lead.trial_convert_expires_at
    ? new Date(String(lead.trial_convert_expires_at))
    : null;
  if (!expires || expires.getTime() <= Date.now() || lead.status === "enrolled") {
    return { ok: false, code: "expired" };
  }

  const { data: seats } = await admin
    .from("registration_trial_seats")
    .select("section_id, status")
    .eq("registration_id", lead.id);
  const facts = await loadTrialConvertQuoteFacts(admin, {
    dni: String(lead.dni),
    sectionIds: parsed.data.sectionIds,
  });
  const policy = await loadFamilyBillingPolicy(admin);
  const quote = planTrialConvertQuote({
    selectedSectionIds: parsed.data.sectionIds,
    seats: (seats ?? []).map((row) => ({
      sectionId: String(row.section_id),
      status: row.status as "booked" | "attended" | "absent" | "released",
      hasOpenSeat: facts.openBySectionId[String(row.section_id)] === true,
    })),
    enrollmentAmounts: facts.enrollmentAmounts,
    monthlyAmounts: facts.monthlyAmounts,
    alreadyPaidEnrollmentIds: facts.alreadyPaidEnrollmentIds,
    alreadyPaidMonthIds: facts.alreadyPaidMonthIds,
    currency: facts.currency,
    ...trialConvertCreditInput(lead, policy.creditPaidTrialOnEnroll),
  });
  if (!quote.ok) return { ok: false, code: quote.code };

  await admin
    .from("registrations")
    .update({
      fee_snapshot: {
        kind: quote.kind,
        total: quote.total,
        currency: quote.currency,
        sectionIds: quote.payableSectionIds,
        enrollmentDue: quote.enrollmentDue,
        monthDue: quote.monthDue,
        trialCreditApplied: quote.trialCreditApplied,
        classPack: facts.classPack,
        periodYear: facts.periodYear,
        periodMonth: facts.periodMonth,
      },
    })
    .eq("id", lead.id);

  if (quote.total <= 0 || parsed.data.method === "free") {
    const captured = await applyTrialConvertGatewayCapture({
      admin,
      registrationId: String(lead.id),
      gatewayAmount: 0,
      gatewayCurrency: quote.currency,
      locale: parsed.data.locale,
    });
    return captured.ok ? { ok: true } : { ok: false, code: "accept_failed" };
  }

  let rawKey: Buffer;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch {
    return { ok: false, code: "method_unavailable" };
  }
  void getDictionary(parsed.data.locale);
  const birth = lead.birth_date ? String(lead.birth_date).slice(0, 10) : "";
  const isMinor = birth
    ? fullYearsFromIsoDate(birth) < getLegalAgeMajorityFromSystem()
    : false;
  const result = await startTrialLeadGatewayCore({
    admin,
    encryptionKey32: rawKey,
    method: parsed.data.method,
    locale: parsed.data.locale,
    purpose: "join",
    registrationId: String(lead.id),
    amount: quote.total,
    currency: quote.currency,
    title: `Unirse ${lead.first_name} ${lead.last_name}`.trim(),
    payerEmail:
      familyEmailForTrialLead({
        isMinor,
        studentEmail: lead.email as string | null,
        tutorEmail: lead.tutor_email as string | null,
      }) ?? "",
    returnPath: `/${parsed.data.locale}/unirse/${parsed.data.token}`,
  });
  if (result.ok) redirect(result.redirectUrl);
  return result;
}
