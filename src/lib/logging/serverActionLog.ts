/**
 * Structured server-side logging (server actions, route handlers, server-only libs).
 * Prefijo único en logs: buscar `[ge:server]` en Vercel / terminal.
 * No registrar secretos ni payloads con PII; usar ids/códigos en meta.
 */

const PREFIX = "[ge:server]";

function includeStack(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Normalize unknown throws for logs and optional tests. */
export function serializeUnknownError(err: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      ...(includeStack() && err.stack
        ? { stack: err.stack.split("\n").slice(0, 8).join("\n") }
        : {}),
    };
  }
  return { name: "NonError", message: typeof err === "string" ? err : JSON.stringify(err) };
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
    ...meta,
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
  console.error(PREFIX, scope, { ...meta, error: serializeUnknownError(err) });
}

/** Unexpected logical outcome (e.g. insert succeeded but returned no row id). */
export function logServerActionInvariantViolation(
  scope: string,
  reason: string,
  meta?: Record<string, unknown>,
): void {
  console.error(PREFIX, scope, { reason, ...meta });
}

/** Alias for route handlers and server utilities (same behavior as logServerActionException). */
export const logServerException = logServerActionException;

/** Alias for logSupabaseClientError (shorter name in route handlers). */
export const logSupabaseError = logSupabaseClientError;

/**
 * Session/autorización esperada (p. ej. assertAdmin). No es bug; usa `warn` para no confundir con 500.
 */
export function logServerAuthzDenied(scope: string, meta?: Record<string, unknown>): void {
  console.warn(PREFIX, scope, { kind: "authz_denied", ...meta });
}
