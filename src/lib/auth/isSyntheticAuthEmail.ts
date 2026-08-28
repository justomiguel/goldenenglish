import { isParentSyntheticEmail } from "@/lib/import/parentDefaultEmail";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";

const LEGACY_STUDENT_SYNTHETIC_SUFFIX = "@students.goldenenglish.local";

/**
 * Auth mailboxes that must never receive product email (they bounce).
 * Covers legacy Golden student/parent domains, `parents.<tenant>` tutors,
 * and minor-student synthetics on `MAIL_TENANT`.
 */
export function isSyntheticAuthEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (trimmed.endsWith(LEGACY_STUDENT_SYNTHETIC_SUFFIX)) return true;
  if (isParentSyntheticEmail(trimmed)) return true;
  const tenant = getRegistrationMailTenantDomain();
  if (tenant && trimmed.endsWith(`@${tenant}`)) return true;
  return false;
}

export function isDeliverableAuthEmail(email: string | null | undefined): boolean {
  const trimmed = (email ?? "").trim();
  if (!trimmed.includes("@")) return false;
  return !isSyntheticAuthEmail(trimmed);
}
