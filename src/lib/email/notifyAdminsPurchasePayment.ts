import "server-only";

import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { sendRegistrationAdminEmails } from "@/lib/email/registrationIntakeEmails";
import { ADMIN_PAID_KIND_LABEL } from "@/lib/email/templates/registryBillingPaymentNotices";
import { ADMIN_EVENT_PAYMENT_STATE } from "@/lib/email/templates/registryEvents";
import { escapeEventEmailHtml } from "@/lib/events/eventEmailCopy";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/types/i18n";

type PaidKind = "event" | "tuition" | "shop";

function mailLocale(raw: string | null | undefined): Locale {
  return raw === "en" || raw === "pt" ? raw : "es";
}

function moneyLabel(amount: number | null, currency: string | null, locale: Locale): string {
  const code = (currency ?? "").trim().toUpperCase();
  if (amount == null || !/^[A-Z]{3}$/.test(code)) return "—";
  try {
    return formatMoneyLabel(amount, code, locale);
  } catch (err) {
    logServerException("notifyAdminsPurchasePayment:amount", err);
    return "—";
  }
}

async function loadEvent(eventId: string): Promise<{ title: string; currency: string | null }> {
  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("events")
    .select("title, currency")
    .eq("id", eventId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("notifyAdminsEventRegistered:event", error, { eventId });
    return { title: "—", currency: null };
  }
  return {
    title: String(data?.title ?? "—"),
    currency: data?.currency ? String(data.currency) : null,
  };
}

async function loadStudentName(studentId: string): Promise<string> {
  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", studentId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("notifyAdminsPaymentPaid:student", error, { studentId });
    return "—";
  }
  return formatProfileNameSurnameFirst(
    data?.first_name ? String(data.first_name) : null,
    data?.last_name ? String(data.last_name) : null,
    "—",
  );
}

export async function notifyAdminsEventRegistered(input: {
  eventId: string;
  firstName: string;
  lastName: string;
  seatCount: number;
  amount: number | null;
  currency: string | null;
  paymentPending: boolean;
  locale: string | null;
}): Promise<void> {
  try {
    const locale = mailLocale(input.locale);
    const event = await loadEvent(input.eventId);
    const currency = input.currency?.trim() || event.currency;
    const state = input.paymentPending
      ? ADMIN_EVENT_PAYMENT_STATE[locale].pending
      : ADMIN_EVENT_PAYMENT_STATE[locale].settled;
    await sendRegistrationAdminEmails({
      locale,
      templateKey: "events.admin_registered",
      vars: {
        eventTitle: escapeEventEmailHtml(event.title),
        buyerName: escapeEventEmailHtml(
          formatProfileNameSurnameFirst(input.firstName, input.lastName, "—"),
        ),
        seatCount: String(Math.max(0, Math.floor(input.seatCount))),
        amountLabel: moneyLabel(input.amount, currency, locale),
        paymentState: state,
      },
    });
  } catch (err) {
    logServerException("notifyAdminsEventRegistered", err, { eventId: input.eventId });
  }
}

export async function notifyAdminsPaymentPaid(input: {
  locale: string | null;
  kind: PaidKind;
  contextLabel: string;
  payerName?: string | null;
  studentId?: string | null;
  amount: number | null;
  currency: string | null;
}): Promise<void> {
  try {
    const locale = mailLocale(input.locale);
    const payer = input.payerName?.trim()
      ? input.payerName
      : input.studentId
        ? await loadStudentName(input.studentId)
        : "—";
    await sendRegistrationAdminEmails({
      locale,
      templateKey: "payments.admin_paid",
      vars: {
        paymentKind: ADMIN_PAID_KIND_LABEL[locale][input.kind],
        contextLabel: escapeEventEmailHtml(input.contextLabel.trim() || "—"),
        payerName: escapeEventEmailHtml(payer.trim() || "—"),
        amountLabel: moneyLabel(input.amount, input.currency, locale),
      },
    });
  } catch (err) {
    logServerException("notifyAdminsPaymentPaid", err, { kind: input.kind });
  }
}

export async function notifyAdminsEventPaymentPaid(paymentId: string): Promise<void> {
  try {
    const admin = await createAdminClient();
    const { data: payment, error } = await admin
      .from("event_payments")
      .select("amount, currency, event_attendee_id")
      .eq("id", paymentId)
      .maybeSingle();
    if (error || !payment?.event_attendee_id) {
      if (error) logSupabaseClientError("notifyAdminsEventPaymentPaid:payment", error, { paymentId });
      return;
    }
    const { data: attendee, error: attendeeError } = await admin
      .from("event_attendees")
      .select("first_name, last_name, registration_locale, event_id")
      .eq("id", String(payment.event_attendee_id))
      .maybeSingle();
    if (attendeeError || !attendee?.event_id) {
      if (attendeeError) {
        logSupabaseClientError("notifyAdminsEventPaymentPaid:attendee", attendeeError, { paymentId });
      }
      return;
    }
    const event = await loadEvent(String(attendee.event_id));
    await notifyAdminsPaymentPaid({
      locale: attendee.registration_locale ? String(attendee.registration_locale) : null,
      kind: "event",
      contextLabel: event.title,
      payerName: formatProfileNameSurnameFirst(
        attendee.first_name ? String(attendee.first_name) : null,
        attendee.last_name ? String(attendee.last_name) : null,
        "—",
      ),
      amount: payment.amount == null ? null : Number(payment.amount),
      currency: payment.currency ? String(payment.currency) : event.currency,
    });
  } catch (err) {
    logServerException("notifyAdminsEventPaymentPaid", err, { paymentId });
  }
}
