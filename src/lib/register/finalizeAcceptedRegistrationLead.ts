import type { SupabaseClient } from "@supabase/supabase-js";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { notifyRegistrationWelcome } from "@/lib/email/registrationIntakeEmails";
import { failAfterStudentCreated } from "@/lib/register/acceptRegistrationHelpers";
import { enrollRequestedSectionsOnAccept } from "@/lib/register/enrollRequestedSectionsOnAccept";
import { localizeRegistrationAcceptError } from "@/lib/register/localizeRegistrationAcceptError";
import {
  applyNagoExtrasOnAccept,
  nagoCareLabelsFromRegisterDict,
} from "@/lib/register/packs/nago/applyNagoExtrasOnAccept";
import { registrationWelcomeSectionLabel } from "@/lib/register/registrationWelcomeSectionLabel";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import { resolveAcceptLeadWrite } from "@/lib/register/resolveAcceptLeadWrite";
import { runJoinBillingDisposition } from "@/lib/billing/runJoinBillingDisposition";
import type { JoinBillingDisposition } from "@/lib/billing/joinBillingDispositionSchema";
import type { Dictionary } from "@/types/i18n";

export async function finalizeAcceptedRegistrationLead(input: {
  admin: SupabaseClient;
  enrollClient: SupabaseClient;
  locale: string;
  dict: Dictionary;
  registration: {
    id: unknown;
    preferred_section_id: unknown;
    additional_section_ids: unknown;
    tenant_extras: unknown;
    fee_snapshot: unknown;
    first_name: unknown;
    last_name: unknown;
    email: unknown;
    tutor_name: unknown;
    tutor_email: unknown;
  };
  studentId: string;
  reuseStudent: boolean;
  isMinor: boolean;
  courseId: string | null;
  applicantUndecided: boolean;
  paidCapture?: boolean;
  enrollServiceRole?: boolean;
  waiveReason?: string;
  skipFamilyWelcome?: boolean;
  joinDisposition: JoinBillingDisposition;
  actorId: string;
}): Promise<
  { ok: true; studentId: string; pendingSectionIds: string[] } | { ok: false; message: string }
> {
  const { admin, dict, studentId } = input;
  const reg = input.registration;
  const additionalSectionIds = Array.isArray(reg.additional_section_ids)
    ? (reg.additional_section_ids as string[]).map(String)
    : [];
  const requestedIds = requestedRegistrationSectionIds({
    preferred_section_id:
      reg.preferred_section_id != null ? String(reg.preferred_section_id) : null,
    additionalSectionIds,
  });
  const pendingSectionIds = input.enrollServiceRole
    ? await enrollRequestedSectionsOnAccept(input.enrollClient, studentId, requestedIds, {
        serviceRole: true,
      })
    : await enrollRequestedSectionsOnAccept(input.enrollClient, studentId, requestedIds);

  try {
    await applyNagoExtrasOnAccept({
      admin,
      studentId,
      tenantExtras: reg.tenant_extras,
      labels: nagoCareLabelsFromRegisterDict(dict.register.nagoPack),
    });
  } catch {
    /* extras mapping must not roll back accept */
  }

  const write = resolveAcceptLeadWrite({
    requestedCount: requestedIds.length,
    pendingCount: pendingSectionIds.length,
    paidCapture: input.paidCapture === true,
    studentId,
  });
  const committed = requestedIds.filter((id) => !pendingSectionIds.includes(id));
  if (committed.length > 0) {
    const seeded = await runJoinBillingDisposition({
      admin,
      studentId,
      sectionIds: committed,
      disposition: input.joinDisposition,
      actorId: input.actorId,
    });
    if (!seeded.ok) {
      return { ok: false, message: localizeRegistrationAcceptError(dict, "save_failed") };
    }
  }
  if (input.paidCapture && committed.length > 0) {
    await admin
      .from("section_enrollments")
      .update({ last_enrollment_paid_at: new Date().toISOString() })
      .eq("student_id", studentId)
      .eq("status", "active")
      .in("section_id", committed);
  }
  if (input.waiveReason && committed.length > 0) {
    await admin
      .from("section_enrollments")
      .update({
        enrollment_fee_exempt: true,
        enrollment_exempt_reason: input.waiveReason,
      })
      .eq("student_id", studentId)
      .eq("status", "active")
      .in("section_id", committed);
    void recordSystemAudit({
      action: "registration_fee_waived",
      resourceType: "registration",
      resourceId: String(reg.id),
      payload: { student_id: studentId, reason: input.waiveReason },
    });
  }

  const { error: upErr } = await admin.from("registrations").update(write).eq("id", reg.id);

  if (upErr) {
    if (input.reuseStudent) {
      return { ok: false, message: localizeRegistrationAcceptError(dict, "save_failed") };
    }
    return failAfterStudentCreated(admin, String(reg.id), studentId, "save_failed", dict);
  }

  void recordSystemAudit({
    action: "registration_accept_enroll",
    resourceType: "registration",
    resourceId: String(reg.id),
    payload: {
      student_id: studentId,
      minor: input.isMinor,
      course_id: input.courseId,
      course_enrollment_skipped: !input.courseId,
      course_skip_reason: !input.courseId
        ? input.applicantUndecided
          ? "undecided"
          : "no_resolved_course"
        : null,
    },
  });

  const undecided = dict.register.enrollmentPayUndecidedSection;
  const sectionName = registrationWelcomeSectionLabel({
    feeSnapshot: reg.fee_snapshot,
    committedSectionIds: committed,
    fallback: undecided,
  });
  const studentName = `${String(reg.first_name)} ${String(reg.last_name)}`.trim();
  if (input.skipFamilyWelcome) {
    return { ok: true, studentId, pendingSectionIds };
  }

  try {
    await notifyRegistrationWelcome({
      locale: input.locale,
      isMinor: input.isMinor,
      studentEmail: reg.email != null ? String(reg.email) : null,
      tutorEmail: reg.tutor_email != null ? String(reg.tutor_email) : null,
      greetingName: input.isMinor
        ? String(reg.tutor_name ?? "").trim() || studentName
        : String(reg.first_name),
      studentName,
      sectionName,
      scheduleLabel: sectionName,
    });
  } catch {
    /* welcome must not roll back accept */
  }

  return { ok: true, studentId, pendingSectionIds };
}
