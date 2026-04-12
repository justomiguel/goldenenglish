import { describe, it, expect } from "vitest";
import { anonymizeIp, sanitizeAnalyticsMetadata } from "@/lib/analytics/sanitizeMetadata";

describe("sanitizeAnalyticsMetadata", () => {
  it("drops email-like keys", () => {
    expect(
      sanitizeAnalyticsMetadata({
        path: "/x",
        email: "x@y.com",
        user_email: "a@b.com",
      }),
    ).toEqual({ path: "/x" });
  });

  it("truncates long strings", () => {
    const long = "a".repeat(600);
    const out = sanitizeAnalyticsMetadata({ x: long });
    expect(String(out.x).length).toBeLessThanOrEqual(502);
  });

  it("keeps finite numbers, booleans, and null", () => {
    expect(
      sanitizeAnalyticsMetadata({
        n: 42,
        flag: true,
        empty: null,
        badNum: Number.NaN,
        inf: Number.POSITIVE_INFINITY,
      }),
    ).toEqual({ n: 42, flag: true, empty: null });
  });

  it("drops keys matching PII regex", () => {
    expect(
      sanitizeAnalyticsMetadata({
        first_name: "A",
        phone: "+1",
        token: "x",
        safe: "ok",
      }),
    ).toEqual({ safe: "ok" });
  });
});

describe("anonymizeIp", () => {
  it("masks IPv4 to /24", () => {
    expect(anonymizeIp("192.168.1.99")).toBe("192.168.1.0");
  });

  it("strips ::ffff: and masks embedded IPv4", () => {
    expect(anonymizeIp("::ffff:127.0.0.1")).toBe("127.0.0.0");
  });

  it("returns null for IPv6 loopback (invalid INET if truncated naively)", () => {
    expect(anonymizeIp("::1")).toBeNull();
  });

  it("returns null for blank input", () => {
    expect(anonymizeIp(null)).toBeNull();
    expect(anonymizeIp("   ")).toBeNull();
  });

  it("returns null for malformed IPv4", () => {
    expect(anonymizeIp("192.168.1")).toBeNull();
    expect(anonymizeIp("192.168.1.999")).toBeNull();
  });
});
