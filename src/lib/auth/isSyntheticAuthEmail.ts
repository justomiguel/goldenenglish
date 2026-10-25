import { isParentSyntheticEmail } from "@/lib/import/parentDefaultEmail";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { knownMailTenantDomains } from "@/lib/tenant/tenantRegistry";

const LEGACY_STUDENT_SYNTHETIC_SUFFIX = "@students.goldenenglish.local";

/** Auto-provisioned minor local-part: `nombreapellido-{documento}` or `alumno-sinid`. */
const SYNTHETIC_MINOR_DOCUMENT_LOCAL_RE =
  /^[a-z][a-z0-9]{1,47}-(?:[0-9]{5,20}[a-z]?|sinid)$/;

/** Compose shape on the current `MAIL_TENANT` (includes letter-only fingerprints). */
const SYNTHETIC_MINOR_TENANT_LOCAL_RE = /^[a-z0-9]{2,48}-[a-z0-9]{1,20}$/;

/**
 * Auth mailboxes that must never receive product email (they bounce).
 * Covers legacy Golden student/parent domains, `parents.<tenant>` tutors,
 * and auto-provisioned minor addresses (`nombre-documento@any-tenant`).
 */
export function isSyntheticAuthEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (trimmed.endsWith(LEGACY_STUDENT_SYNTHETIC_SUFFIX)) return true;
  if (isParentSyntheticEmail(trimmed)) return true;
  const at = trimmed.lastIndexOf("@");
  if (at < 1) return false;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (SYNTHETIC_MINOR_DOCUMENT_LOCAL_RE.test(local)) return true;
  const domains = new Set(knownMailTenantDomains());
  const tenant = getRegistrationMailTenantDomain();
  if (tenant) domains.add(tenant);
  if (domains.has(domain) && SYNTHETIC_MINOR_TENANT_LOCAL_RE.test(local)) {
    return true;
  }
  return false;
}

export function isDeliverableAuthEmail(email: string | null | undefined): boolean {
  const trimmed = (email ?? "").trim();
  if (!trimmed.includes("@")) return false;
  return !isSyntheticAuthEmail(trimmed);
}
