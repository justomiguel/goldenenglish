/**
 * Logs en navegador (hooks, analytics cliente, PWA). Prefijo `[ge:client]` para filtrar.
 * No usar para secretos ni PII; ids/códigos en meta si hace falta.
 */
import { serializeUnknownError } from "@/lib/logging/serializeUnknownError";

const PREFIX = "[ge:client]";

function browserHost(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location?.hostname;
  if (typeof host !== "string") return null;
  const normalized = host.trim().toLowerCase();
  return normalized || null;
}

function withBrowserHost(meta?: Record<string, unknown>): Record<string, unknown> {
  return { host: browserHost(), ...meta };
}

export function logClientException(
  scope: string,
  err: unknown,
  meta?: Record<string, unknown>,
): void {
  console.error(PREFIX, scope, withBrowserHost({ ...meta, error: serializeUnknownError(err) }));
}

export function logClientWarn(scope: string, meta?: Record<string, unknown>): void {
  console.warn(PREFIX, scope, withBrowserHost(meta));
}
