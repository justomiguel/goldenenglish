import { normalizeHost } from "@/lib/tenant/parseTenantConfigJson";
import { serializeUnknownError } from "@/lib/logging/serializeUnknownError";

function headerValue(value: string | string[] | null | undefined): string | null {
  if (Array.isArray(value)) return value[0]?.trim() || null;
  const text = value?.trim() ?? "";
  return text || null;
}

/** Fields for one server render or route failure. No cookies and no keys. */
export function pageRequestErrorMeta(args: {
  error: unknown;
  path: string;
  method: string;
  hostHeader: string | string[] | null | undefined;
  routePath: string;
  routeType: string;
  digest?: string;
}): Record<string, unknown> {
  const serialized = serializeUnknownError(args.error);
  const rawHost = headerValue(args.hostHeader);
  return {
    host: rawHost ? normalizeHost(rawHost) : null,
    path: args.path,
    method: args.method,
    routePath: args.routePath,
    routeType: args.routeType,
    digest: args.digest ?? null,
    errorName: serialized.name,
    errorMessage: serialized.message,
    ...(serialized.stack ? { stack: serialized.stack } : {}),
  };
}
