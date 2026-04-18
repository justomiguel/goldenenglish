// REGRESSION CHECK: Initial coverage. Critical invariants:
//  - same (ip,email) bucket is throttled after MAX_ATTEMPTS within the window,
//  - bucket resets after the window,
//  - case-insensitive on email so attackers cannot bypass via case.

/** @vitest-environment node */
import { describe, it, expect, beforeEach } from "vitest";
import {
  checkPasswordResetRateLimit,
  PASSWORD_RESET_RATE_LIMIT,
} from "@/lib/auth/passwordResetRateLimit";

describe("checkPasswordResetRateLimit", () => {
  let store: Map<
    string,
    { count: number; windowStart: number }
  >;

  beforeEach(() => {
    store = new Map();
  });

  it("allows up to MAX_ATTEMPTS calls in the same window", () => {
    const now = 1_000_000;
    for (let i = 0; i < PASSWORD_RESET_RATE_LIMIT.MAX_ATTEMPTS; i++) {
      const r = checkPasswordResetRateLimit({
        ip: "1.2.3.4",
        email: "u@e.com",
        now: () => now,
        store,
      });
      expect(r.allowed).toBe(true);
    }
  });

  it("blocks the (MAX_ATTEMPTS + 1)-th call with retryAfter > 0", () => {
    const now = 1_000_000;
    for (let i = 0; i < PASSWORD_RESET_RATE_LIMIT.MAX_ATTEMPTS; i++) {
      checkPasswordResetRateLimit({
        ip: "1.2.3.4",
        email: "u@e.com",
        now: () => now,
        store,
      });
    }
    const blocked = checkPasswordResetRateLimit({
      ip: "1.2.3.4",
      email: "u@e.com",
      now: () => now,
      store,
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the bucket after the window expires", () => {
    let now = 1_000_000;
    for (let i = 0; i < PASSWORD_RESET_RATE_LIMIT.MAX_ATTEMPTS; i++) {
      checkPasswordResetRateLimit({
        ip: "1.2.3.4",
        email: "u@e.com",
        now: () => now,
        store,
      });
    }
    now += PASSWORD_RESET_RATE_LIMIT.WINDOW_MS + 1;
    const r = checkPasswordResetRateLimit({
      ip: "1.2.3.4",
      email: "u@e.com",
      now: () => now,
      store,
    });
    expect(r.allowed).toBe(true);
  });

  it("treats different ip+email pairs as independent buckets", () => {
    const now = 1_000_000;
    for (let i = 0; i < PASSWORD_RESET_RATE_LIMIT.MAX_ATTEMPTS; i++) {
      checkPasswordResetRateLimit({
        ip: "1.2.3.4",
        email: "a@e.com",
        now: () => now,
        store,
      });
    }
    const otherEmail = checkPasswordResetRateLimit({
      ip: "1.2.3.4",
      email: "b@e.com",
      now: () => now,
      store,
    });
    const otherIp = checkPasswordResetRateLimit({
      ip: "5.6.7.8",
      email: "a@e.com",
      now: () => now,
      store,
    });
    expect(otherEmail.allowed).toBe(true);
    expect(otherIp.allowed).toBe(true);
  });

  it("normalizes case + whitespace on the email when bucketing", () => {
    const now = 1_000_000;
    for (let i = 0; i < PASSWORD_RESET_RATE_LIMIT.MAX_ATTEMPTS; i++) {
      checkPasswordResetRateLimit({
        ip: "1.2.3.4",
        email: "  User@Example.com ",
        now: () => now,
        store,
      });
    }
    const sameAddrDifferentCasing = checkPasswordResetRateLimit({
      ip: "1.2.3.4",
      email: "user@example.com",
      now: () => now,
      store,
    });
    expect(sameAddrDifferentCasing.allowed).toBe(false);
  });

  it("uses 'unknown' as IP fallback when the request has none", () => {
    const now = 1_000_000;
    for (let i = 0; i < PASSWORD_RESET_RATE_LIMIT.MAX_ATTEMPTS; i++) {
      checkPasswordResetRateLimit({
        ip: null,
        email: "u@e.com",
        now: () => now,
        store,
      });
    }
    const blocked = checkPasswordResetRateLimit({
      ip: null,
      email: "u@e.com",
      now: () => now,
      store,
    });
    expect(blocked.allowed).toBe(false);
  });
});
