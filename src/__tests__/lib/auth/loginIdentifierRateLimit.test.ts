// REGRESSION CHECK: Initial coverage. Critical invariants:
//  - same (ip,identifier) bucket is throttled after MAX_ATTEMPTS within the
//    window so a brute-force attacker cannot enumerate DNIs at scale,
//  - bucket resets after the window so legitimate users are not locked out
//    forever,
//  - identifier is normalized (lower + trim) so case differences cannot
//    bypass the limit,
//  - module-level state is isolated from passwordResetRateLimit (different
//    feature, different counters).

/** @vitest-environment node */
import { describe, it, expect, beforeEach } from "vitest";
import {
  checkLoginIdentifierRateLimit,
  LOGIN_IDENTIFIER_RATE_LIMIT,
} from "@/lib/auth/loginIdentifierRateLimit";

describe("checkLoginIdentifierRateLimit", () => {
  let store: Map<
    string,
    { count: number; windowStart: number }
  >;

  beforeEach(() => {
    store = new Map();
  });

  it("allows up to MAX_ATTEMPTS calls in the same window", () => {
    const now = 1_000_000;
    for (let i = 0; i < LOGIN_IDENTIFIER_RATE_LIMIT.MAX_ATTEMPTS; i++) {
      const r = checkLoginIdentifierRateLimit({
        ip: "1.2.3.4",
        identifier: "12345678",
        now: () => now,
        store,
      });
      expect(r.allowed).toBe(true);
    }
  });

  it("blocks the (MAX_ATTEMPTS + 1)-th call with retryAfter > 0", () => {
    const now = 1_000_000;
    for (let i = 0; i < LOGIN_IDENTIFIER_RATE_LIMIT.MAX_ATTEMPTS; i++) {
      checkLoginIdentifierRateLimit({
        ip: "1.2.3.4",
        identifier: "12345678",
        now: () => now,
        store,
      });
    }
    const blocked = checkLoginIdentifierRateLimit({
      ip: "1.2.3.4",
      identifier: "12345678",
      now: () => now,
      store,
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the bucket after the window expires", () => {
    let now = 1_000_000;
    for (let i = 0; i < LOGIN_IDENTIFIER_RATE_LIMIT.MAX_ATTEMPTS; i++) {
      checkLoginIdentifierRateLimit({
        ip: "1.2.3.4",
        identifier: "12345678",
        now: () => now,
        store,
      });
    }
    now += LOGIN_IDENTIFIER_RATE_LIMIT.WINDOW_MS + 1;
    const r = checkLoginIdentifierRateLimit({
      ip: "1.2.3.4",
      identifier: "12345678",
      now: () => now,
      store,
    });
    expect(r.allowed).toBe(true);
  });

  it("treats different ip+identifier pairs as independent buckets", () => {
    const now = 1_000_000;
    for (let i = 0; i < LOGIN_IDENTIFIER_RATE_LIMIT.MAX_ATTEMPTS; i++) {
      checkLoginIdentifierRateLimit({
        ip: "1.2.3.4",
        identifier: "11111111",
        now: () => now,
        store,
      });
    }
    const otherIdentifier = checkLoginIdentifierRateLimit({
      ip: "1.2.3.4",
      identifier: "22222222",
      now: () => now,
      store,
    });
    const otherIp = checkLoginIdentifierRateLimit({
      ip: "5.6.7.8",
      identifier: "11111111",
      now: () => now,
      store,
    });
    expect(otherIdentifier.allowed).toBe(true);
    expect(otherIp.allowed).toBe(true);
  });

  it("normalizes case + whitespace on the identifier when bucketing", () => {
    const now = 1_000_000;
    for (let i = 0; i < LOGIN_IDENTIFIER_RATE_LIMIT.MAX_ATTEMPTS; i++) {
      checkLoginIdentifierRateLimit({
        ip: "1.2.3.4",
        identifier: "  AB1234 ",
        now: () => now,
        store,
      });
    }
    const sameAddrDifferentCasing = checkLoginIdentifierRateLimit({
      ip: "1.2.3.4",
      identifier: "ab1234",
      now: () => now,
      store,
    });
    expect(sameAddrDifferentCasing.allowed).toBe(false);
  });

  it("uses 'unknown' as IP fallback when the request has none", () => {
    const now = 1_000_000;
    for (let i = 0; i < LOGIN_IDENTIFIER_RATE_LIMIT.MAX_ATTEMPTS; i++) {
      checkLoginIdentifierRateLimit({
        ip: null,
        identifier: "12345678",
        now: () => now,
        store,
      });
    }
    const blocked = checkLoginIdentifierRateLimit({
      ip: null,
      identifier: "12345678",
      now: () => now,
      store,
    });
    expect(blocked.allowed).toBe(false);
  });
});
