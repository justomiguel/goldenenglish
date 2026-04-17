/**
 * Logs en navegador (hooks, analytics cliente, PWA). Prefijo `[ge:client]` para filtrar.
 * No usar para secretos ni PII; ids/códigos en meta si hace falta.
 */
import { serializeUnknownError } from "@/lib/logging/serverActionLog";

const PREFIX = "[ge:client]";

export function logClientException(
  scope: string,
  err: unknown,
  meta?: Record<string, unknown>,
): void {
  console.error(PREFIX, scope, { ...meta, error: serializeUnknownError(err) });
}

export function logClientWarn(scope: string, meta?: Record<string, unknown>): void {
  console.warn(PREFIX, scope, meta ?? {});
}
