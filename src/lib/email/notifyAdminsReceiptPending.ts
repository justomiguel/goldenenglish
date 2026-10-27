import "server-only";

import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { sendRegistrationAdminEmails } from "@/lib/email/registrationIntakeEmails";
import { ADMIN_RECEIPT_KIND_LABEL } from "@/lib/email/templates/registryBillingPaymentNotices";
import { escapeEventEmailHtml } from "@/lib/events/eventEmailCopy";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/types/i18n";

type ReceiptKind = "event" | "tuition" | "enrollment" | "invoice";

function mailLocale(raw: string | null | undefined): Locale {
  return raw === "en" || raw === "pt" ? raw : "es";
}

function moneyLabel(amount: number | null, currency: string | null, locale: Locale): string {
  const code = (currency ?? "").trim().toUpperCase();
  if (amount == null) return "—";
  if (!/^[A-Z]{3}$/.test(code)) return String(amount);
  try {
    return formatMoneyLabel(amount, code, locale);
  } catch (err) {
    logServerException("notifyAdminsReceiptPending:amount", err);
    return "—";
  }
}

async function loadStudentName(studentId: string): Promise<string> {
  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", studentId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("notifyAdminsReceiptPending:student", error, { studentId });
    return "—";
  }
  return formatProfileNameSurnameFirst(
    data?.first_name ? String(data.first_name) : null,
    data?.last_name ? String(data.last_name) : null,
    "—",
  );
}

async function loadSectionName(sectionId: string): Promise<string> {
  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("academic_sections")
    .select("name")
    .eq("id", sectionId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("notifyAdminsReceiptPending:section", error, { sectionId });
    return "—";
  }
  const name = data?.name ? String(data.name).trim() : "";
  return name || "—";
}

export async function notifyAdminsReceiptPending(input: {
  locale: string | null;
  kind: ReceiptKind;
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
      templateKey: "payments.admin_receipt_pending",
      vars: {
        paymentKind: ADMIN_RECEIPT_KIND_LABEL[locale][input.kind],
        contextLabel: escapeEventEmailHtml(input.contextLabel.trim() || "—"),
        payerName: escapeEventEmailHtml(payer.trim() || "—"),
        amountLabel: moneyLabel(input.amount, input.currency, locale),
      },
    });
  } catch (err) {
    logServerException("notifyAdminsReceiptPending", err, { kind: input.kind });
  }
}

export async function notifyAdminsEnrollmentReceipt(
  locale: string | null,
  studentId: string,
  sectionId: string,
): Promise<void> {
  try {
    const sectionName = await loadSectionName(sectionId);
    await notifyAdminsReceiptPending({
      locale,
      kind: "enrollment",
      contextLabel: sectionName,
      studentId,
      amount: null,
      currency: null,
    });
  } catch (err) {
    logServerException("notifyAdminsEnrollmentReceipt", err, { studentId, sectionId });
  }
}

export async function notifyAdminsEventReceiptPending(attendeeId: string): Promise<void> {
  try {
    const admin = await createAdminClient();
    const { data: attendee, error } = await admin
      .from("event_attendees")
      .select("first_name, last_name, registration_locale, event_id")
      .eq("id", attendeeId)
      .maybeSingle();
    if (error || !attendee?.event_id) {
      if (error) logSupabaseClientError("notifyAdminsEventReceiptPending:attendee", error, { attendeeId });
      return;
    }
    const { data: event, error: eventError } = await admin
      .from("events")
      .select("title")
      .eq("id", String(attendee.event_id))
      .maybeSingle();
    if (eventError) {
      logSupabaseClientError("notifyAdminsEventReceiptPending:event", eventError, { attendeeId });
    }
    const { data: payment, error: paymentError } = await admin
      .from("event_payments")
      .select("amount, currency")
      .eq("event_attendee_id", attendeeId)
      .maybeSingle();
    if (paymentError) {
      logSupabaseClientError("notifyAdminsEventReceiptPending:payment", paymentError, { attendeeId });
    }
    await notifyAdminsReceiptPending({
      locale: attendee.registration_locale ? String(attendee.registration_locale) : null,
      kind: "event",
      contextLabel: event?.title ? String(event.title) : "—",
      payerName: formatProfileNameSurnameFirst(
        attendee.first_name ? String(attendee.first_name) : null,
        attendee.last_name ? String(attendee.last_name) : null,
        "—",
      ),
      amount: payment?.amount == null ? null : Number(payment.amount),
      currency: payment?.currency ? String(payment.currency) : null,
    });
  } catch (err) {
    logServerException("notifyAdminsEventReceiptPending", err, { attendeeId });
  }
}
