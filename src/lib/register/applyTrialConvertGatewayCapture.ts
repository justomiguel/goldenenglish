import type { SupabaseClient } from "@supabase/supabase-js";
import { amountsMatchForCurrency } from "@/lib/billing/upsertApprovedMonthlyPaymentSupport";
import { getDictionary, defaultLocale } from "@/lib/i18n/dictionaries";
import { acceptRegistrationLead } from "@/lib/register/acceptRegistrationLead";
import { notifyTrialConvertMails } from "@/lib/register/notifyTrialConvertMails";
import { resolveExistingStudentByDni } from "@/lib/register/resolveExistingStudentByDni";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function applyTrialConvertGatewayCapture(input: {
  admin: SupabaseClient;
  registrationId: string;
  gatewayAmount: number;
  gatewayCurrency: string;
  locale: string;
}): Promise<{ ok: true; skipped?: string; studentId?: string } | { ok: false }> {
  const { data, error } = await input.admin
    .from("registrations")
    .select(
      "id, intent, status, dni, fee_snapshot, trial_convert_expires_at, first_name, last_name, email, tutor_name, tutor_email, birth_date",
    )
    .eq("id", input.registrationId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("applyTrialConvertGatewayCapture:select", error, {
      registrationId: input.registrationId,
    });
    return { ok: false };
  }
  if (!data) return { ok: true, skipped: "not_found" };
  const row = data as Record<string, unknown>;
  if (String(row.intent ?? "") !== "trial") return { ok: true, skipped: "not_found" };
  if (String(row.status ?? "") === "enrolled") {
    return { ok: true, skipped: "already_enrolled" };
  }
  const expires = row.trial_convert_expires_at
    ? new Date(String(row.trial_convert_expires_at))
    : null;
  if (!expires || expires.getTime() <= Date.now()) {
    return { ok: true, skipped: "expired" };
  }
  const snapshot = (row.fee_snapshot ?? {}) as {
    kind?: unknown;
    total?: unknown;
    currency?: unknown;
    sectionIds?: unknown;
  };
  const expected = Number(snapshot.total ?? 0);
  const currency = String(snapshot.currency ?? input.gatewayCurrency).toUpperCase();
  if (expected > 0 && !amountsMatchForCurrency(expected, input.gatewayAmount, currency)) {
    return { ok: true, skipped: "amount_mismatch" };
  }
  const sectionIds = Array.isArray(snapshot.sectionIds)
    ? snapshot.sectionIds.map(String).filter(Boolean)
    : [];
  if (sectionIds.length === 0) return { ok: true, skipped: "no_section" };

  const { error: secErr } = await input.admin
    .from("registrations")
    .update({
      preferred_section_id: sectionIds[0],
      additional_section_ids: sectionIds.slice(1),
      fee_captured: expected > 0,
    })
    .eq("id", input.registrationId);
  if (secErr) {
    logSupabaseClientError("applyTrialConvertGatewayCapture:sections", secErr, {
      registrationId: input.registrationId,
    });
    return { ok: false };
  }

  const identity = await resolveExistingStudentByDni(input.admin, String(row.dni ?? ""));
  const dict = await getDictionary(input.locale || defaultLocale);
  const accepted = await acceptRegistrationLead({
    admin: input.admin,
    enrollClient: input.admin,
    locale: input.locale || defaultLocale,
    dict,
    registrationId: input.registrationId,
    paidCapture: expected > 0,
    enrollServiceRole: true,
    skipFamilyWelcome: true,
    joinDisposition: { kind: "current" },
  });
  if (!accepted.ok) return { ok: false };

  const { data: leftover } = await input.admin
    .from("registration_trial_seats")
    .select("id, section_id")
    .eq("registration_id", input.registrationId)
    .eq("status", "attended");
  const keep = new Set(sectionIds);
  const releaseIds = (leftover ?? [])
    .filter((seat) => !keep.has(String(seat.section_id)))
    .map((seat) => String(seat.id));
  if (releaseIds.length) {
    await input.admin
      .from("registration_trial_seats")
      .update({ status: "released" })
      .in("id", releaseIds);
  }

  void notifyTrialConvertMails({
    locale: input.locale || defaultLocale,
    dict,
    reuseStudent: identity.kind === "student",
    isMinor: false,
    studentName: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
    studentFirstName: String(row.first_name ?? ""),
    studentEmail: row.email == null ? null : String(row.email),
    tutorName: row.tutor_name == null ? null : String(row.tutor_name),
    tutorEmail: row.tutor_email == null ? null : String(row.tutor_email),
    birthDate: row.birth_date == null ? null : String(row.birth_date).slice(0, 10),
    sectionLabel: sectionIds.join(" · "),
  });
  return { ok: true, studentId: accepted.studentId };
}
