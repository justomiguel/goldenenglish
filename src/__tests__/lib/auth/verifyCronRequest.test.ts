/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { verifyCronRequest } from "@/lib/auth/verifyCronRequest";

/**
 * REGRESSION CHECK: Cron auth used to accept the secret in the query string
 * (`?secret=...`), which leaks via Referer, browser history, proxy / CDN logs
 * and any subsequent outbound link. We dropped that fallback and only allow
 * server-controlled headers. These tests pin that contract so the regression
 * never silently sneaks back in (OWASP A05/A07).
 */

const URL_BASE = "http://localhost/api/cron/whatever";

describe("verifyCronRequest", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when CRON_SECRET env is missing", () => {
    const req = new Request(URL_BASE, {
      headers: { authorization: "Bearer anything" },
    });
    expect(verifyCronRequest(req)).toBe(false);
  });

  it("returns false when CRON_SECRET env is empty/whitespace", () => {
    vi.stubEnv("CRON_SECRET", "   ");
    const req = new Request(URL_BASE, {
      headers: { authorization: "Bearer abc" },
    });
    expect(verifyCronRequest(req)).toBe(false);
  });

  it("accepts Authorization: Bearer <secret>", () => {
    vi.stubEnv("CRON_SECRET", "abc");
    const req = new Request(URL_BASE, {
      headers: { authorization: "Bearer abc" },
    });
    expect(verifyCronRequest(req)).toBe(true);
  });

  it("accepts x-cron-secret header", () => {
    vi.stubEnv("CRON_SECRET", "abc");
    const req = new Request(URL_BASE, {
      headers: { "x-cron-secret": "abc" },
    });
    expect(verifyCronRequest(req)).toBe(true);
  });

  it("rejects wrong Bearer secret", () => {
    vi.stubEnv("CRON_SECRET", "abc");
    const req = new Request(URL_BASE, {
      headers: { authorization: "Bearer wrong" },
    });
    expect(verifyCronRequest(req)).toBe(false);
  });

  it("rejects wrong x-cron-secret value", () => {
    vi.stubEnv("CRON_SECRET", "abc");
    const req = new Request(URL_BASE, {
      headers: { "x-cron-secret": "wrong" },
    });
    expect(verifyCronRequest(req)).toBe(false);
  });

  it("does NOT accept ?secret=... in the query string (regression)", () => {
    vi.stubEnv("CRON_SECRET", "abc");
    const req = new Request(`${URL_BASE}?secret=abc`);
    expect(verifyCronRequest(req)).toBe(false);
  });

  it("does NOT accept ?secret=... even alongside an empty Authorization header", () => {
    vi.stubEnv("CRON_SECRET", "abc");
    const req = new Request(`${URL_BASE}?secret=abc`, {
      headers: { authorization: "" },
    });
    expect(verifyCronRequest(req)).toBe(false);
  });

  it("returns false when no auth headers present", () => {
    vi.stubEnv("CRON_SECRET", "abc");
    const req = new Request(URL_BASE);
    expect(verifyCronRequest(req)).toBe(false);
  });
});
