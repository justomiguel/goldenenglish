/**
 * Structured server-side logging (server actions, route handlers, server-only libs).
 * Prefijo único en logs: buscar `[ge:server]` en Vercel / terminal.
 * No registrar secretos ni payloads con PII; usar ids/códigos en meta.
 */

import { serializeUnknownError } from "@/lib/logging/serializeUnknownError";
import { normalizeHost } from "@/lib/tenant/parseTenantConfigJson";

export { serializeUnknownError };

const PREFIX = "[ge:server]";

type HeaderGet = { get(name: string): string | null };

/**
 * Client screens import this module through shared loaders.
 * A static `next/headers` import would break that bundle.
 * `instrumentation.ts` registers the reader on the server.
 */
let readHeaderStore: () => HeaderGet | null = () => null;

export function registerRequestHeaderReader(reader: () => HeaderGet | null): void {
  readHeaderStore = reader;
}

function requestLogContext(): { host: string | null; tenantSlug: string | null } {
  try {
    const headerStore = readHeaderStore();
    if (!headerStore || typeof headerStore.get !== "function") {
      return { host: null, tenantSlug: null };
    }
    const raw = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    const slug = headerStore.get("x-ge-tenant")?.trim() || null;
    return { host: raw ? normalizeHost(raw) : null, tenantSlug: slug };
  } catch {
    return { host: null, tenantSlug: null };
  }
}

function withRequestLogMeta(meta?: Record<string, unknown>): Record<string, unknown> {
  const ctx = requestLogContext();
  return { host: ctx.host, tenantSlug: ctx.tenantSlug, ...meta };
}

type PostgrestLike = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

/**
 * PostgREST / Supabase JS error object from `.error` on a query (no throw).
 */
export function logSupabaseClientError(
  scope: string,
  error: PostgrestLike | null | undefined,
  meta?: Record<string, unknown>,
): void {
  if (!error?.message && !error?.code) return;
  console.error(PREFIX, scope, {
    ...withRequestLogMeta(meta),
    supabase: {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    },
  });
}

/**
 * Thrown errors (assertAdmin, bugs, network) from a server action catch block.
 */
export function logServerActionException(
  scope: string,
  err: unknown,
  meta?: Record<string, unknown>,
): void {
  console.error(PREFIX, scope, withRequestLogMeta({ ...meta, error: serializeUnknownError(err) }));
}

/** Unexpected logical outcome (e.g. insert succeeded but returned no row id). */
export function logServerActionInvariantViolation(
  scope: string,
  reason: string,
  meta?: Record<string, unknown>,
): void {
  console.error(PREFIX, scope, withRequestLogMeta({ reason, ...meta }));
}

/** Alias for route handlers and server utilities (same behavior as logServerActionException). */
export const logServerException = logServerActionException;

/** Alias for logSupabaseClientError (shorter name in route handlers). */
export const logSupabaseError = logSupabaseClientError;

/**
 * Session/autorización esperada (p. ej. assertAdmin). No es bug; usa `warn` para no confundir con 500.
 */
export function logServerAuthzDenied(scope: string, meta?: Record<string, unknown>): void {
  console.warn(PREFIX, scope, withRequestLogMeta({ kind: "authz_denied", ...meta }));
}

/** Diagnóstico operativo (no error de app): filtros locales, branching previsto. Sin PII. */
export function logServerWarn(scope: string, meta?: Record<string, unknown>): void {
  console.warn(PREFIX, scope, withRequestLogMeta(meta));
}

/** Breadcrumb operativo (envío aceptado, conteos). Sin PII. */
export function logServerInfo(scope: string, meta?: Record<string, unknown>): void {
  console.info(PREFIX, scope, withRequestLogMeta(meta));
}

/** Fallo operativo con meta plana (sin wrappear en Error). Sin PII. */
export function logServerError(scope: string, meta?: Record<string, unknown>): void {
  console.error(PREFIX, scope, withRequestLogMeta(meta));
}

type AuthAdminErrLike = {
  message?: string | null;
  code?: string | null;
  status?: number | string | null;
};

/**
 * Auth `admin.createUser` / invite failures — log message/code/status for ops (mirror Supabase Auth logs).
 *
 * `meta` must not include passwords, tokens, or **arbitrary** PII blobs.
 * For duplicate-login diagnosis only (`classified_issue: "email_exists"`), callers may add
 * `collision_attempt_email_normalized` plus `collision_email_domain_suffix` using
 * `authInviteCollisionEmailMeta()` (`@/lib/logging/authInviteAttemptLogMeta`) — privileged ops
 * correlation (same login address used with Supabase Auth).
 */
export function logAuthAdminCreateUserFailure(
  scope: string,
  error: AuthAdminErrLike | null | undefined,
  meta?: Record<string, unknown>,
): void {
  const message = error?.message != null ? String(error.message) : "";
  const code = error?.code != null ? String(error.code) : "";
  const statusRaw = error?.status;
  const statusNum =
    typeof statusRaw === "number" && Number.isFinite(statusRaw)
      ? statusRaw
      : typeof statusRaw === "string" && /^[0-9]+$/.test(statusRaw)
        ? Number.parseInt(statusRaw, 10)
        : undefined;
  console.error(PREFIX, scope, withRequestLogMeta({
    kind: "auth_admin_create_user_failure",
    ...meta,
    auth_error: message || code || statusRaw != null ? { message, code, status: statusNum ?? statusRaw } : null,
  }));
}
