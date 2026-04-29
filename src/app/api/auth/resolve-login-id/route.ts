import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseLoginIdentifier } from "@/lib/auth/parseLoginIdentifier";
import { lookupEmailByDni } from "@/lib/auth/lookupEmailByDni";
import { checkLoginIdentifierRateLimit } from "@/lib/auth/loginIdentifierRateLimit";
import {
  logServerException,
  logServerActionInvariantViolation,
} from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

const PRIVATE_CACHE = "private, no-store, max-age=0";

const bodySchema = z.object({
  identifier: z.string().min(1).max(254),
});

function clientIpFromRequest(request: Request): string | null {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    return first || null;
  }
  return request.headers.get("x-real-ip");
}

function jsonResponse(body: unknown, status: number, retryAfter?: number) {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": PRIVATE_CACHE,
  });
  if (typeof retryAfter === "number") {
    headers.set("Retry-After", String(Math.max(1, Math.floor(retryAfter))));
  }
  return new NextResponse(JSON.stringify(body), { status, headers });
}

/**
 * Resolve a typed login identifier (email or DNI/passport) into the email
 * address Supabase Auth will accept on `signInWithPassword`.
 *
 * Trust-boundary contract (regla 17):
 *  - Response is **opaque**: a DNI that maps to a real account and a DNI
 *    that maps to nobody both return a `{ email }` payload, so the public
 *    endpoint is not a user-existence oracle.
 *  - `Cache-Control: private, no-store` so CDNs / proxies cannot serve one
 *    client's resolved address to another.
 *  - Rate limited per (IP, identifier) bucket with `checkLoginIdentifierRateLimit`.
 *  - Errors are logged via `[ge:server]`; the body never includes details.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch (err) {
    logServerException("api/auth/resolve-login-id:json", err);
    return jsonResponse({ ok: false }, 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonResponse({ ok: false }, 400);
  }

  const identifier = parsed.data.identifier.trim();
  if (identifier.length === 0) {
    return jsonResponse({ ok: false }, 400);
  }

  const ip = clientIpFromRequest(request);
  const limit = checkLoginIdentifierRateLimit({ ip, identifier });
  if (!limit.allowed) {
    return jsonResponse(
      { ok: false, message: "rate_limited" },
      429,
      limit.retryAfterSeconds,
    );
  }

  const parsedIdentifier = parseLoginIdentifier(identifier);
  if (parsedIdentifier.kind === "invalid") {
    return jsonResponse({ ok: false }, 400);
  }

  if (parsedIdentifier.kind === "email") {
    return jsonResponse({ email: parsedIdentifier.value }, 200);
  }

  let email: string;
  try {
    const admin = createAdminClient();
    email = await lookupEmailByDni(admin, parsedIdentifier.value);
  } catch (err) {
    // Even on unexpected failure stay opaque: derive the synthetic so the
    // login flow can proceed and fail at Supabase Auth uniformly.
    logServerActionInvariantViolation(
      "api/auth/resolve-login-id:lookup_throw",
      err instanceof Error ? err.message : "unknown",
    );
    email = `${parsedIdentifier.value}@students.goldenenglish.local`;
  }

  return jsonResponse({ email }, 200);
}
