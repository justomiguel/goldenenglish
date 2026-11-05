/**
 * Structured server-side logging (server actions, route handlers, server-only libs).
 * Prefijo único en logs: buscar `[ge:server]` en Vercel / terminal.
 * No registrar secretos ni payloads con PII; usar ids/códigos en meta.
 */

import { serializeUnknownError } from "@/lib/logging/serializeUnknownError";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { normalizeHost } from "@/lib/tenant/parseTenantConfigJson";

export { serializeUnknownError };

const PREFIX = "[ge:server]";

type HeaderGet = { get(name: string): string | null };
type HeaderReader = () => HeaderGet | Promise<HeaderGet | null> | null;

/**
 * Client screens import this module through shared loaders.
 * A static `next/headers` import would break that bundle.
 * `instrumentation.ts` registers the reader on the server.
 * Next.js 16 `headers()` returns a Promise. The reader must be awaited.
 */
let readHeaderStore: HeaderReader = () => null;

export function registerRequestHeaderReader(reader: HeaderReader): void {
  readHeaderStore = reader;
}

function nonEmpty(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

async function liveHeaderStore(): Promise<HeaderGet | null> {
  try {
    const registered = await readHeaderStore();
    if (registered && typeof registered.get === "function") return registered;
  } catch {
    /* The direct reader below still runs. */
  }
  if (typeof window !== "undefined") return null;
  try {
    const { readRequestLogHeaders } = await import("@/lib/logging/readRequestLogHeaders");
    return readRequestLogHeaders();
  } catch {
    return null;
  }
}

async function requestLogContext(): Promise<{ host: string | null; tenantSlug: string | null }> {
  let host: string | null = null;
  let tenantSlug: string | null = null;
  const headerStore = await liveHeaderStore();
  if (headerStore) {
    const raw = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    host = raw ? normalizeHost(raw) : null;
    tenantSlug = headerStore.get("x-ge-tenant")?.trim() || null;
  }

  const als = getAlsTenant();
  if (als?.slug) tenantSlug = als.slug;
  if (!host) {
    const alsHost = als?.hosts?.find((item) => item.trim().length > 0) ?? "";
    host = alsHost ? normalizeHost(alsHost) : null;
  }
  return { host, tenantSlug };
}

async function withRequestLogMeta(meta?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ctx = await requestLogContext();
  const metaHost = nonEmpty(meta?.host);
  const metaSlug = nonEmpty(meta?.tenantSlug);
  return {
    ...meta,
    host: metaHost ? normalizeHost(metaHost) : ctx.host,
    tenantSlug: metaSlug ? metaSlug.toLowerCase() : ctx.tenantSlug,
  };
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
export async function logSupabaseClientError(
  scope: string,
  error: PostgrestLike | null | undefined,
  meta?: Record<string, unknown>,
): Promise<void> {
  if (!error?.message && !error?.code) return;
  console.error(PREFIX, scope, {
    ...(await withRequestLogMeta(meta)),
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
export async function logServerActionException(
  scope: string,
  err: unknown,
  meta?: Record<string, unknown>,
): Promise<void> {
  console.error(
    PREFIX,
    scope,
    await withRequestLogMeta({ ...meta, error: serializeUnknownError(err) }),
  );
}

/** Unexpected logical outcome (e.g. insert succeeded but returned no row id). */
export async function logServerActionInvariantViolation(
  scope: string,
  reason: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  console.error(PREFIX, scope, await withRequestLogMeta({ reason, ...meta }));
}

/** Alias for route handlers and server utilities (same behavior as logServerActionException). */
export const logServerException = logServerActionException;

/** Alias for logSupabaseClientError (shorter name in route handlers). */
export const logSupabaseError = logSupabaseClientError;

/**
 * Session/autorización esperada (p. ej. assertAdmin). No es bug; usa `warn` para no confundir con 500.
 */
export async function logServerAuthzDenied(
  scope: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  console.warn(PREFIX, scope, await withRequestLogMeta({ kind: "authz_denied", ...meta }));
}

/** Diagnóstico operativo (no error de app): filtros locales, branching previsto. Sin PII. */
export async function logServerWarn(
  scope: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  console.warn(PREFIX, scope, await withRequestLogMeta(meta));
}

/** Breadcrumb operativo (envío aceptado, conteos). Sin PII. */
export async function logServerInfo(
  scope: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  console.info(PREFIX, scope, await withRequestLogMeta(meta));
}

/** Fallo operativo con meta plana (sin wrappear en Error). Sin PII. */
export async function logServerError(
  scope: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  console.error(PREFIX, scope, await withRequestLogMeta(meta));
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
export async function logAuthAdminCreateUserFailure(
  scope: string,
  error: AuthAdminErrLike | null | undefined,
  meta?: Record<string, unknown>,
): Promise<void> {
  const message = error?.message != null ? String(error.message) : "";
  const code = error?.code != null ? String(error.code) : "";
  const statusRaw = error?.status;
  const statusNum =
    typeof statusRaw === "number" && Number.isFinite(statusRaw)
      ? statusRaw
      : typeof statusRaw === "string" && /^[0-9]+$/.test(statusRaw)
        ? Number.parseInt(statusRaw, 10)
        : undefined;
  console.error(
    PREFIX,
    scope,
    await withRequestLogMeta({
      kind: "auth_admin_create_user_failure",
      ...meta,
      auth_error:
        message || code || statusRaw != null ? { message, code, status: statusNum ?? statusRaw } : null,
    }),
  );
}
