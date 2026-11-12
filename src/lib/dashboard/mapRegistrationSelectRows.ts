import { mapInboxLeadFields } from "@/lib/register/countRegistrationInboxFilters";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

export const REGISTRATION_LIST_COLUMNS = [
  "id", "first_name", "last_name", "dni", "email", "phone",
  "birth_date", "level_interest", "status", "created_at",
  "tutor_name", "tutor_dni", "tutor_email", "tutor_phone",
  "tutor_relationship", "preferred_section_id", "additional_section_ids",
  "contacted_at", "contacted_by", "source_section_link_id", "tenant_extras",
  "intake_state", "fee_snapshot", "fee_captured", "enrollment_fee_paid_method",
  "accepted_student_id", "enrollment_fee_receipt_path", "enrollment_fee_mail_sent_at",
  "proposed_section_id",
  "intent", "trial_convert_token", "trial_convert_expires_at", "trial_refund_due_amount",
  "privacy_accepted_at", "privacy_policy_version",
].join(", ");

type RegistrationSelectRow = {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  level_interest: string | null;
  status: string | null;
  created_at: string | null;
  tutor_name: string | null;
  tutor_dni: string | null;
  tutor_email: string | null;
  tutor_phone: string | null;
  tutor_relationship: string | null;
  preferred_section_id: string | null;
  additional_section_ids: string[] | null;
  contacted_at: string | null;
  contacted_by: string | null;
  source_section_link_id: string | null;
  tenant_extras?: unknown;
  intake_state?: unknown;
  fee_snapshot?: unknown;
  fee_captured?: unknown;
  enrollment_fee_paid_method?: unknown;
  accepted_student_id?: unknown;
  enrollment_fee_receipt_path?: unknown;
  enrollment_fee_mail_sent_at?: unknown;
  proposed_section_id?: string | null;
  intent?: string | null;
  trial_convert_token?: string | null;
  trial_convert_expires_at?: string | null;
  trial_refund_due_amount?: unknown;
  privacy_accepted_at?: string | null;
  privacy_policy_version?: string | null;
};

export function mapRegistrationSelectRows(rawRows: unknown[]): AdminRegistrationRow[] {
  return (rawRows as RegistrationSelectRow[]).map((r) => ({
    id: String(r.id),
    first_name: String(r.first_name),
    last_name: String(r.last_name),
    dni: String(r.dni),
    email: String(r.email),
    phone: r.phone != null ? String(r.phone) : null,
    birth_date:
      r.birth_date != null && r.birth_date !== ""
        ? String(r.birth_date).slice(0, 10)
        : null,
    level_interest: r.level_interest != null ? String(r.level_interest) : null,
    status: String(r.status ?? ""),
    created_at: r.created_at != null ? String(r.created_at) : null,
    tutor_name: r.tutor_name != null ? String(r.tutor_name) : null,
    tutor_dni: r.tutor_dni != null ? String(r.tutor_dni) : null,
    tutor_email: r.tutor_email != null ? String(r.tutor_email) : null,
    tutor_phone: r.tutor_phone != null ? String(r.tutor_phone) : null,
    tutor_relationship:
      r.tutor_relationship != null ? String(r.tutor_relationship) : null,
    preferred_section_id:
      r.preferred_section_id != null ? String(r.preferred_section_id) : null,
    additionalSectionIds: Array.isArray(r.additional_section_ids)
      ? r.additional_section_ids.map(String).filter(Boolean)
      : [],
    existingStudentId: null,
    contacted_at: r.contacted_at != null ? String(r.contacted_at) : null,
    contacted_by: r.contacted_by != null ? String(r.contacted_by) : null,
    sourceSectionLinkId:
      r.source_section_link_id != null ? String(r.source_section_link_id) : null,
    tenantExtras: r.tenant_extras ?? {},
    intent: r.intent === "trial" ? "trial" : "reserve",
    trialConvertToken: r.trial_convert_token != null ? String(r.trial_convert_token) : null,
    trialConvertExpiresAt:
      r.trial_convert_expires_at != null ? String(r.trial_convert_expires_at) : null,
    trialRefundDueAmount: Number(r.trial_refund_due_amount ?? 0) || 0,
    privacy_accepted_at: r.privacy_accepted_at != null ? String(r.privacy_accepted_at) : null,
    privacy_policy_version:
      r.privacy_policy_version != null ? String(r.privacy_policy_version) : null,
    proposedSectionId:
      r.proposed_section_id != null ? String(r.proposed_section_id) : null,
    ...mapInboxLeadFields(r),
    enrollmentFeePaidMethod:
      typeof r.enrollment_fee_paid_method === "string" ? r.enrollment_fee_paid_method : null,
    acceptedStudentId:
      r.accepted_student_id != null ? String(r.accepted_student_id) : null,
  }));
}
