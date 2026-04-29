import { parseLoginIdentifier } from "@/lib/auth/parseLoginIdentifier";

export const LOGIN_LOG_PREFIX = "[goldenenglish:login]";

/** Traces (submit steps, fingerprints): dev by default, or `NEXT_PUBLIC_DEBUG_LOGIN=true`. */
export function loginDiagnosticsVerbose(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return process.env.NEXT_PUBLIC_DEBUG_LOGIN === "true";
}

/**
 * Safe-for-console fingerprint of the typed identifier (email or DNI):
 * never logs the raw value, never logs the password.
 */
export function identifierFingerprint(
  raw: string,
): { length: number; kind: "email" | "dni" | "invalid"; domain: string | null } {
  const t = raw.trim();
  const at = t.indexOf("@");
  if (at <= 0 || at === t.length - 1) {
    return {
      length: t.length,
      kind: t.length === 0 ? "invalid" : "dni",
      domain: null,
    };
  }
  return {
    length: t.length,
    kind: "email",
    domain: t.slice(at + 1).toLowerCase(),
  };
}

export function loginTrace(event: string, details?: Record<string, unknown>) {
  if (!loginDiagnosticsVerbose()) return;
  console.info(LOGIN_LOG_PREFIX, { event, at: new Date().toISOString(), ...details });
}

export function loginFail(event: string, details?: Record<string, unknown>) {
  console.error(LOGIN_LOG_PREFIX, { event, ...details });
}

/** Avoid open redirects: only relative paths without a protocol. */
export function safeInternalPath(next: string | null | undefined, locale: string): string {
  const fallback = `/${locale}`;
  if (next == null || next === "") return fallback;
  const t = next.trim();
  if (
    !t.startsWith("/") ||
    t.startsWith("//") ||
    t.includes("://") ||
    t.includes("\\")
  ) {
    return fallback;
  }
  return t;
}

/**
 * Resolve a DNI/passport into the email Supabase Auth expects by calling the
 * opaque server endpoint. Email-shaped identifiers skip this step.
 */
export async function resolveIdentifierToEmail(
  identifier: string,
): Promise<string | null> {
  const parsed = parseLoginIdentifier(identifier);
  if (parsed.kind === "invalid") return null;
  if (parsed.kind === "email") return parsed.value;
  try {
    const res = await fetch("/api/auth/resolve-login-id", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: parsed.value }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: unknown };
    if (typeof data.email !== "string" || data.email.length === 0) return null;
    return data.email;
  } catch {
    return null;
  }
}
