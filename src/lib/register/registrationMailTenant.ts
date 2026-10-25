import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { preferTenantValue } from "@/lib/tenant/preferTenantValue";

/**
 * Dominio usado cuando un menor omite correo el alumno en preinscripción pública
 * (`MAIL_TENANT` en servidor). Sin esquema URL ni `@` inicial.
 * Cron jobs read the institute domain from the request store first.
 */

const DOMAIN_RE =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

/** Lowercase domain, or null when the value is missing or not a hostname. */
export function normalizeMailTenantDomain(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  let cleaned = raw.replace(/^mailto:/iu, "").replace(/^@+/u, "").trim();
  const hash = cleaned.indexOf("#");
  if (hash >= 0) cleaned = cleaned.slice(0, hash);
  cleaned = cleaned.toLowerCase();
  if (!DOMAIN_RE.test(cleaned)) return null;
  return cleaned;
}

/** Devuelve el dominio en minúsculas o null si falta / no parece RFC 1035-like. */
export function getRegistrationMailTenantDomain(): string | null {
  const fromTenant = getAlsTenant()?.mailTenant ?? null;
  return normalizeMailTenantDomain(preferTenantValue(fromTenant, process.env.MAIL_TENANT));
}
