import type { SupabaseClient } from "@supabase/supabase-js";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { buildRegistrationEnrollmentFeeInsertFields } from "@/lib/register/buildRegistrationEnrollmentFeeInsertFields";
import { notifyPublicRegistrationReceived } from "@/lib/register/completePublicRegistrationSubmit";
import { registrationIsActionable } from "@/lib/register/registrationIsActionable";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";
import { registrationWelcomeSectionLabel } from "@/lib/register/registrationWelcomeSectionLabel";
import type { Dictionary } from "@/types/i18n";

export async function startAdminRegistrationEnrollmentFeeFlow(input: {
  admin: SupabaseClient;
  locale: string;
  dict: Dictionary;
  registrationId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const { data: lead, error } = await input.admin
    .from("registrations")
    .select(
      "id,status,first_name,last_name,email,tutor_name,tutor_email,birth_date,preferred_section_id,additional_section_ids,fee_captured",
    )
    .eq("id", input.registrationId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("startAdminRegistrationEnrollmentFeeFlow:select", error, {
      registrationId: input.registrationId,
    });
    return { ok: false, code: "not_found" };
  }
  if (!lead || !registrationIsActionable(String(lead.status ?? ""))) {
    return { ok: false, code: lead ? "already_processed" : "not_found" };
  }

  const sectionIds = requestedRegistrationSectionIds({
    preferred_section_id:
      lead.preferred_section_id != null ? String(lead.preferred_section_id) : null,
    additionalSectionIds: Array.isArray(lead.additional_section_ids)
      ? lead.additional_section_ids.map(String)
      : [],
  });
  if (sectionIds.length === 0) return { ok: false, code: "needs_section" };

  const open = await requestedSectionsHaveOpenSeats(input.admin, sectionIds);
  if (!open) {
    await input.admin
      .from("registrations")
      .update({ intake_state: "section_full" })
      .eq("id", lead.id);
    return { ok: false, code: "section_full" };
  }

  const quoted = await buildRegistrationEnrollmentFeeInsertFields({
    admin: input.admin,
    sectionIds,
    nowIso: new Date().toISOString(),
  });
  const { error: upErr } = await input.admin
    .from("registrations")
    .update({
      pay_token: quoted.pay_token,
      fee_snapshot: quoted.fee_snapshot,
      intake_state: quoted.intake_state,
      fee_captured: false,
    })
    .eq("id", lead.id);
  if (upErr) {
    logSupabaseClientError("startAdminRegistrationEnrollmentFeeFlow:update", upErr, {
      registrationId: String(lead.id),
    });
    return { ok: false, code: "save_failed" };
  }

  const birth =
    lead.birth_date != null && String(lead.birth_date).trim() !== ""
      ? String(lead.birth_date).trim().slice(0, 10)
      : "";
  const isMinor =
    /^\d{4}-\d{2}-\d{2}$/.test(birth) &&
    fullYearsFromIsoDate(birth) < getLegalAgeMajorityFromSystem();
  const sectionName = registrationWelcomeSectionLabel({
    feeSnapshot: quoted.fee_snapshot,
    committedSectionIds: sectionIds,
    fallback: input.dict.register.enrollmentPayUndecidedSection,
  });
  await notifyPublicRegistrationReceived({
    locale: input.locale,
    dict: input.dict,
    isMinor,
    studentFirstName: String(lead.first_name),
    studentLastName: String(lead.last_name),
    studentEmail: lead.email != null ? String(lead.email) : "",
    tutorName: lead.tutor_name != null ? String(lead.tutor_name) : null,
    tutorEmail: lead.tutor_email != null ? String(lead.tutor_email) : null,
    sectionLabel: sectionName,
    payToken: quoted.pay_token,
    snapshotTotal: quoted.fee_snapshot.total,
    snapshotCurrency: quoted.fee_snapshot.currency,
  });
  void recordSystemAudit({
    action: "registration_enrollment_fee_flow_started",
    resourceType: "registration",
    resourceId: String(lead.id),
    payload: { section_ids: sectionIds, intake_state: quoted.intake_state },
  });
  return { ok: true };
}
