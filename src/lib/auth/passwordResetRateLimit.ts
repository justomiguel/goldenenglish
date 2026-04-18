/**
 * In-memory rate limiter for the password reset request flow.
 *
 * Scope: best-effort defense in single-instance / dev environments. On
 * serverless platforms (Vercel) each worker keeps its own Map, so this is
 * **not** a strict global limit; it does prevent obvious bursts from a single
 * client and acts as a placeholder until a shared store (Upstash/Redis) is
 * introduced. See ADR `2026-04-forgot-password-resend.md`.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface Bucket {
  count: number;
  windowStart: number;
}

type Clock = () => number;

const buckets = new Map<string, Bucket>();

/** Lower-case + trim so requests with case differences share a bucket. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function bucketKey(ip: string | null, email: string): string {
  return `${ip ?? "unknown"}|${normalizeEmail(email)}`;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets (only meaningful when `allowed=false`). */
  retryAfterSeconds: number;
}

export interface CheckPasswordResetRateLimitOptions {
  ip: string | null;
  email: string;
  /** Injected for tests. Defaults to `Date.now`. */
  now?: Clock;
  /** Injected for tests. Defaults to module-level `buckets`. */
  store?: Map<string, Bucket>;
}

export function checkPasswordResetRateLimit({
  ip,
  email,
  now = Date.now,
  store = buckets,
}: CheckPasswordResetRateLimitOptions): RateLimitResult {
  const key = bucketKey(ip, email);
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
export function __resetPasswordResetRateLimitForTests(): void {
  buckets.clear();
}

export const PASSWORD_RESET_RATE_LIMIT = {
  WINDOW_MS,
  MAX_ATTEMPTS,
} as const;
