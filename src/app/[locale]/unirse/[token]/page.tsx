import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadEnabledGatewaysForBillingCurrency } from "@/lib/payment-gateways/loadEnabledGatewaysForBillingCurrency";
import { loadBankTransferInstructionsSetting } from "@/lib/billing/loadBankTransferInstructionsSetting";
import { resolveRegistrationPublicPayMethods } from "@/lib/register/resolveRegistrationPublicPayMethods";
import { planTrialConvertQuote } from "@/lib/register/planTrialConvertQuote";
import { loadTrialConvertQuoteFacts } from "@/lib/register/loadTrialConvertQuoteFacts";
import {
  TrialConvertExpiredScreen,
  TrialConvertScreen,
} from "@/components/register/TrialConvertScreen";

export const dynamic = "force-dynamic";

export default async function TrialConvertPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const dict = await getDictionary(locale);
  const labels = dict.register.trial;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registration_public_convert_context", {
    p_token: token,
  });
  const row = !error && data ? (Array.isArray(data) ? data[0] : data) : null;
  if (!row || (row as { expired?: boolean }).expired) {
    return <TrialConvertExpiredScreen title={labels.convertExpiredTitle} lead={labels.convertExpiredLead} />;
  }

  const context = row as {
    first_name?: string;
    last_name?: string;
    seats?: { sectionId?: string; status?: string; label?: string }[];
  };
  const seats = Array.isArray(context.seats) ? context.seats : [];
  const sectionIds = seats.map((seat) => String(seat.sectionId ?? "")).filter(Boolean);
  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("registrations")
    .select("dni")
    .eq("trial_convert_token", token)
    .maybeSingle();
  const facts = await loadTrialConvertQuoteFacts(admin, {
    dni: String(lead?.dni ?? ""),
    sectionIds,
  });
  const quote = planTrialConvertQuote({
    selectedSectionIds: sectionIds,
    seats: seats.map((seat) => ({
      sectionId: String(seat.sectionId ?? ""),
      status: (seat.status as "booked" | "attended" | "absent" | "released") ?? "booked",
      hasOpenSeat: facts.openBySectionId[String(seat.sectionId ?? "")] === true,
    })),
    enrollmentAmounts: facts.enrollmentAmounts,
    monthlyAmounts: facts.monthlyAmounts,
    alreadyPaidEnrollmentIds: facts.alreadyPaidEnrollmentIds,
    alreadyPaidMonthIds: facts.alreadyPaidMonthIds,
    currency: facts.currency,
  });
  const [gateways, transfer] = await Promise.all([
    loadEnabledGatewaysForBillingCurrency(admin, facts.currency),
    loadBankTransferInstructionsSetting(admin),
  ]);
  const methods = resolveRegistrationPublicPayMethods({
    enabledGateways: gateways.map((row) => row.provider),
    transferInstructions: transfer.instructions,
  });

  return (
    <TrialConvertScreen
      locale={locale}
      token={token}
      studentName={`${context.first_name ?? ""} ${context.last_name ?? ""}`.trim()}
      seats={seats.map((seat) => ({
        sectionId: String(seat.sectionId ?? ""),
        label: String(seat.label ?? ""),
        status: String(seat.status ?? ""),
        payable:
          facts.openBySectionId[String(seat.sectionId ?? "")] === true ||
          seat.status === "attended",
      }))}
      quoteTotal={quote.ok ? quote.total : 0}
      quoteCurrency={quote.ok ? quote.currency : facts.currency}
      quoteKind={quote.ok ? quote.kind : "first_month"}
      methods={methods}
      labels={{
        title: labels.convertTitle,
        lead: labels.convertLead,
        expiredTitle: labels.convertExpiredTitle,
        expiredLead: labels.convertExpiredLead,
        pick: labels.convertPick,
        amount: labels.convertAmount,
        enrollmentKind: labels.convertEnrollment,
        monthKind: labels.convertMonth,
        bothKind: labels.convertEnrollmentAndMonth,
        joinFree: labels.convertFree,
        flow: dict.register.enrollmentPayFlow,
        mercadoPago: dict.register.enrollmentPayMercadoPago,
        error: labels.convertError,
        nonePayable: labels.convertNonePayable,
      }}
    />
  );
}
