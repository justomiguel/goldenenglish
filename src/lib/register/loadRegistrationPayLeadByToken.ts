import type { SupabaseClient } from "@supabase/supabase-js";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { resolveRegistrationFamilyEmail } from "@/lib/register/resolveRegistrationFamilyEmail";

export type RegistrationPayLead = {
  id: string;
  status: string;
  intakeState: string;
  feeCaptured: boolean;
  snapshotTotal: number;
  snapshotCurrency: string;
  preferredSectionId: string | null;
  additionalSectionIds: string[];
  isMinor: boolean;
  studentEmail: string | null;
  tutorEmail: string | null;
  firstName: string;
  lastName: string;
  tutorName: string | null;
};

export function requestedSectionIdsFromLead(lead: RegistrationPayLead): string[] {
  return [lead.preferredSectionId, ...lead.additionalSectionIds].filter(
    (id): id is string => Boolean(id),
  );
}

export function familyEmailFromPayLead(lead: RegistrationPayLead): string | null {
  const domain = getRegistrationMailTenantDomain();
  const studentEmail = (lead.studentEmail ?? "").trim().toLowerCase();
  const synthetic = Boolean(domain && studentEmail.endsWith(`@${domain}`));
  return resolveRegistrationFamilyEmail({
    isMinor: lead.isMinor,
    tutorEmail: lead.tutorEmail,
    studentEmail,
    studentEmailIsSynthetic: synthetic,
  });
}

export async function loadRegistrationPayLeadByToken(
  admin: SupabaseClient,
  payToken: string,
): Promise<RegistrationPayLead | null> {
  const { data, error } = await admin
    .from("registrations")
    .select(
      "id, status, intake_state, fee_captured, fee_snapshot, preferred_section_id, additional_section_ids, is_minor, student_email, tutor_email, first_name, last_name, tutor_name",
    )
    .eq("pay_token", payToken)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  const snapshot = (row.fee_snapshot ?? {}) as { total?: unknown; currency?: unknown };
  const total = Number(snapshot.total ?? 0);
  const extra = row.additional_section_ids;
  return {
    id: String(row.id),
    status: String(row.status ?? "new"),
    intakeState: String(row.intake_state ?? "none"),
    feeCaptured: row.fee_captured === true,
    snapshotTotal: Number.isFinite(total) ? total : 0,
    snapshotCurrency: String(snapshot.currency ?? "USD"),
    preferredSectionId:
      row.preferred_section_id == null ? null : String(row.preferred_section_id),
    additionalSectionIds: Array.isArray(extra)
      ? extra.map((id) => String(id)).filter(Boolean)
      : [],
    isMinor: row.is_minor === true,
    studentEmail: row.student_email == null ? null : String(row.student_email),
    tutorEmail: row.tutor_email == null ? null : String(row.tutor_email),
    firstName: String(row.first_name ?? "").trim(),
    lastName: String(row.last_name ?? "").trim(),
    tutorName: row.tutor_name == null ? null : String(row.tutor_name),
  };
}
