import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";

/** Pre-multi-tenant synthetic mailbox (still treated as non-deliverable). */
export const LEGACY_PARENT_SYNTHETIC_DOMAIN = "parents.goldenenglish.local";

/**
 * Domain for new parent/tutor Auth synthetics: `parents.<MAIL_TENANT>`.
 * Returns null when `MAIL_TENANT` is unset/invalid — callers that provision
 * users must fail closed; opaque login fallbacks may use the legacy domain.
 */
export function parentSyntheticMailDomain(): string | null {
  const tenant = getRegistrationMailTenantDomain();
  if (!tenant) return null;
  if (tenant.startsWith("parents.")) return tenant;
  return `parents.${tenant}`;
}

/**
 * Distinct synthetic email space so student + tutor DNI never collide.
 * Requires `MAIL_TENANT` (same env as minor student synthetics).
 */
export function parentDefaultEmail(dni: string): string | null {
  const domain = parentSyntheticMailDomain();
  if (!domain) return null;
  const safe = dni.replace(/[^\dA-Za-z]/g, "").toLowerCase() || "sin-doc";
  return `${safe}@${domain}`;
}

/** True for legacy Golden and any `@parents.<domain>` synthetic mailbox. */
export function isParentSyntheticEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) return false;
  if (trimmed.endsWith(`@${LEGACY_PARENT_SYNTHETIC_DOMAIN}`)) return true;
  return /@parents\.[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/u.test(trimmed);
}
