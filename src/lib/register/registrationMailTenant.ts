/**
 * Dominio usado cuando un menor omite correo el alumno en preinscripción pública
 * (`MAIL_TENANT` en servidor). Sin esquema URL ni `@` inicial.
 */

const DOMAIN_RE =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

/** Devuelve el dominio en minúsculas o null si falta / no parece RFC 1035-like. */
export function getRegistrationMailTenantDomain(): string | null {
  const raw = process.env.MAIL_TENANT?.trim();
  if (!raw) return null;
  let cleaned = raw.replace(/^mailto:/iu, "").replace(/^@+/u, "").trim();
  const hash = cleaned.indexOf("#");
  if (hash >= 0) cleaned = cleaned.slice(0, hash);
  cleaned = cleaned.toLowerCase();
  if (!DOMAIN_RE.test(cleaned)) return null;
  return cleaned;
}
