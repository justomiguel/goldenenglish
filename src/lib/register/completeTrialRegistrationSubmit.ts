import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import type { PublicRegistrationInput } from "@/lib/register/publicRegistrationSchema";
import type { ExistingStudentResolution } from "@/lib/register/resolveExistingStudentByDni";
import { getPublicCtaMode } from "@/lib/settings/getPublicCtaMode";
import { getInstituteTimeZone } from "@/lib/datetime/instituteTimeZone";
import { parseRequestedSectionIds } from "@/lib/register/parseRequestedSectionIds";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";
import { mapRegistrationSectionPickerRows } from "@/lib/register/registrationSectionPicker";
import {
  buildTrialFeeSnapshot,
  evaluateTrialDniGate,
  planTrialSeats,
} from "@/lib/register/trialSubmitPlan";
import { loadTrialSubmitFacts } from "@/lib/register/loadTrialSubmitFacts";
import { generateRegistrationPayToken } from "@/lib/register/generateRegistrationPayToken";
import { buildRegistrationFeeSnapshot } from "@/lib/register/registrationFeeSnapshot";
import { intakeStateForSnapshotTotal } from "@/lib/register/registrationIntake";
import { notifyTrialRegistrationReceived } from "@/lib/register/notifyTrialRegistrationReceived";
import { composeSyntheticMinorStudentEmail } from "@/lib/register/composeSyntheticMinorStudentEmail";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { privacyAcceptanceStamp } from "@/lib/privacy/privacyAcceptanceStamp";

export async function completeTrialRegistrationSubmit(input: {
  locale: string;
  dict: Dictionary;
  supabase: SupabaseClient;
  admin: SupabaseClient;
  parsed: PublicRegistrationInput;
  identity: ExistingStudentResolution;
  extras: unknown;
  age: number;
  legal: number;
  now?: Date;
}): Promise<{ ok: boolean; message?: string }> {
  const reg = input.dict.register;
  const mode = await getPublicCtaMode();
  if (mode === "reserve") return { ok: false, message: reg.validationError };

  const selectedIds = [
    input.parsed.preferred_section_id,
    ...(input.parsed.additional_section_ids ?? []),
  ];
  const parsedSections = parseRequestedSectionIds({
    selectedIds,
    sectionOptionsOrder: selectedIds.filter(
      (id) => id && id !== REGISTRATION_UNDECIDED_FORM_VALUE,
    ),
    allowUndecided: false,
  });
  if (!parsedSections.ok || parsedSections.undecided || !parsedSections.preferredSectionId) {
    return { ok: false, message: reg.trial.needsSection };
  }
  const sectionIds = [
    parsedSections.preferredSectionId,
    ...parsedSections.additionalSectionIds,
  ];

  const { data: pickerRows } = await input.supabase.rpc("list_registration_section_picker_options");
  const options = mapRegistrationSectionPickerRows(pickerRows);
  const studentId = input.identity.kind === "student" ? input.identity.studentId : null;
  const facts = await loadTrialSubmitFacts(input.admin, {
    studentId,
    dni: input.parsed.dni,
    sectionIds,
  });
  const gate = evaluateTrialDniGate({
    requestedSectionIds: sectionIds,
    enrolledSectionIds: facts.enrolledSectionIds,
    hasOpenTrial: facts.hasOpenTrial,
  });
  if (!gate.ok) {
    return {
      ok: false,
      message: gate.code === "already_enrolled" ? reg.trial.alreadyEnrolled : reg.trial.openTrialExists,
    };
  }

  const now = input.now ?? new Date();
  const planned = planTrialSeats({
    options,
    sectionIds,
    amountsBySectionId: facts.amountsBySectionId,
    now,
    timeZone: getInstituteTimeZone(),
  });
  if (!planned.ok) {
    return {
      ok: false,
      message: planned.code === "no_section" ? reg.trial.needsSection : reg.trial.sectionUnavailable,
    };
  }

  const trialSnapshot = buildTrialFeeSnapshot({
    currency: facts.currency,
    seats: planned.seats,
  });
  const payToken = generateRegistrationPayToken();
  const feeSnapshot = buildRegistrationFeeSnapshot({
    mode: "per_section",
    currency: facts.currency,
    nowIso: now.toISOString(),
    sections: [],
  });
  const existingStudent = input.identity.kind === "student";
  let resolvedEmail: string;
  if (input.identity.kind === "student") {
    resolvedEmail = input.identity.email;
  } else if (input.age < input.legal) {
    const domain = getRegistrationMailTenantDomain();
    if (!domain) {
      return { ok: false, message: input.dict.actionErrors.register.mailTenantMissing };
    }
    resolvedEmail = composeSyntheticMinorStudentEmail(
      input.parsed.first_name,
      input.parsed.last_name,
      input.parsed.dni,
      domain,
    ).toLowerCase();
  } else {
    resolvedEmail = input.parsed.email.trim().toLowerCase();
  }

  const { data: lead, error } = await input.supabase
    .from("registrations")
    .insert({
      first_name: input.parsed.first_name,
      last_name: input.parsed.last_name,
      dni: input.parsed.dni,
      email: resolvedEmail,
      phone: existingStudent || input.age < input.legal ? null : input.parsed.phone.trim(),
      birth_date: input.parsed.birth_date,
      preferred_section_id: parsedSections.preferredSectionId,
      additional_section_ids: parsedSections.additionalSectionIds,
      level_interest: planned.seats.map((s) => s.label).join(" · "),
      status: "new",
      intent: "trial",
      tutor_name: existingStudent ? null : input.parsed.tutor_name?.trim() || null,
      tutor_dni: existingStudent ? null : input.parsed.tutor_dni?.trim() || null,
      tutor_phone: existingStudent ? null : input.parsed.tutor_phone?.trim() || null,
      tutor_email: existingStudent ? null : input.parsed.tutor_email?.trim() || null,
      tutor_relationship: existingStudent ? null : input.parsed.tutor_relationship?.trim() || null,
      tenant_extras: input.extras,
      pay_token: payToken,
      fee_snapshot: feeSnapshot,
      trial_fee_snapshot: trialSnapshot,
      intake_state: intakeStateForSnapshotTotal(feeSnapshot.total),
      fee_captured: false,
      ...privacyAcceptanceStamp(now),
    })
    .select("id")
    .single();
  if (error || !lead) return { ok: false, message: input.dict.actionErrors.register.insertFailed };

  const { error: seatErr } = await input.admin.from("registration_trial_seats").insert(
    planned.seats.map((seat) => ({
      registration_id: String((lead as { id: string }).id),
      section_id: seat.sectionId,
      day_of_week: seat.dayOfWeek,
      start_time: seat.startTime,
      end_time: seat.endTime,
      scheduled_on: seat.scheduledOn,
      trial_fee_amount: seat.trialFeeAmount,
      status: "booked",
    })),
  );
  if (seatErr) return { ok: false, message: input.dict.actionErrors.register.insertFailed };

  void notifyTrialRegistrationReceived({
    locale: input.locale,
    dict: input.dict,
    isMinor: input.age < input.legal,
    studentFirstName: input.parsed.first_name,
    studentLastName: input.parsed.last_name,
    studentEmail: resolvedEmail,
    tutorName: existingStudent ? null : input.parsed.tutor_name?.trim() || null,
    tutorEmail: existingStudent ? null : input.parsed.tutor_email?.trim() || null,
    sectionLabel: planned.seats.map((s) => s.label).join(" · "),
    payToken,
    snapshotTotal: trialSnapshot.total,
    snapshotCurrency: trialSnapshot.currency,
  });
  return { ok: true };
}
