/**
 * In-memory rate limiter for the login identifier resolver
 * (`POST /api/auth/resolve-login-id`).
 *
 * Scope: best-effort defense in single-instance / dev environments. On
 * serverless platforms (Vercel) each worker keeps its own Map, so this is
 * **not** a strict global limit; it does prevent obvious bursts from a
 * single client and acts as a placeholder until a shared store
 * (Upstash/Redis) is introduced. Same trade-off as `passwordResetRateLimit`,
 * documented in `docs/adr/2026-04-login-by-dni.md`.
 *
 * Kept as a separate module from `passwordResetRateLimit` on purpose:
 *  - login is invoked far more often than password reset, so the budget
 *    differs (10 attempts / 15min here vs 5 attempts / 15min there),
 *  - sharing buckets would let a slow brute-force on the resolver lock out
 *    the password-reset path for the same identifier, and vice versa.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

interface Bucket {
  count: number;
  windowStart: number;
}

type Clock = () => number;

const buckets = new Map<string, Bucket>();

/** Lower-case + trim so requests with case differences share a bucket. */
function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

function bucketKey(ip: string | null, identifier: string): string {
  return `${ip ?? "unknown"}|${normalizeIdentifier(identifier)}`;
}

export interface LoginIdentifierRateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets (only meaningful when `allowed=false`). */
  retryAfterSeconds: number;
}

export interface CheckLoginIdentifierRateLimitOptions {
  ip: string | null;
  identifier: string;
  /** Injected for tests. Defaults to `Date.now`. */
  now?: Clock;
  /** Injected for tests. Defaults to module-level `buckets`. */
  store?: Map<string, Bucket>;
}

export function checkLoginIdentifierRateLimit({
  ip,
  identifier,
  now = Date.now,
  store = buckets,
}: CheckLoginIdentifierRateLimitOptions): LoginIdentifierRateLimitResult {
  const key = bucketKey(ip, identifier);
  const ts = now();
  const existing = store.get(key);

  if (!existing || ts - existing.windowStart >= WINDOW_MS) {
    store.set(key, { count: 1, windowStart: ts });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= MAX_ATTEMPTS) {
    const remainingMs = WINDOW_MS - (ts - existing.windowStart);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Test helper — keep small to avoid leaking internals into production code. */
export function __resetLoginIdentifierRateLimitForTests(): void {
  buckets.clear();
}

export const LOGIN_IDENTIFIER_RATE_LIMIT = {
  WINDOW_MS,
  MAX_ATTEMPTS,
} as const;
