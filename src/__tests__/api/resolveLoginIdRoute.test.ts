// REGRESSION CHECK: Initial coverage. Critical invariants:
//  - response is ALWAYS opaque: same shape and status whether the DNI maps
//    to a real account, an account with synthetic email, or no account at
//    all (OWASP A07: prevent user enumeration).
//  - email-shaped identifiers are returned verbatim (lower+trim) without
//    touching the database (no enumeration vector via timing either).
//  - Cache-Control includes `private` and excludes `public` so CDNs cannot
//    serve one client's resolved address to another (regla 17).
//  - rate-limited requests get 429 + Retry-After header.
//  - malformed bodies get 400 (no DB touch).

/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";

const lookupEmailByDniMock = vi.fn();
const checkRateLimitMock = vi.fn();

vi.mock("@/lib/auth/lookupEmailByDni", () => ({
  lookupEmailByDni: (...args: unknown[]) => lookupEmailByDniMock(...args),
}));

vi.mock("@/lib/auth/loginIdentifierRateLimit", () => ({
  checkLoginIdentifierRateLimit: (...args: unknown[]) =>
    checkRateLimitMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ __admin: true }),
}));

import { POST } from "@/app/api/auth/resolve-login-id/route";

function makeRequest(body: unknown, init?: RequestInit): Request {
  return new Request("http://localhost/api/auth/resolve-login-id", {
    method: "POST",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    body: JSON.stringify(body),
    ...init,
  });
}

describe("POST /api/auth/resolve-login-id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
  });

  it("returns 200 + the real email when the DNI matches an account", async () => {
    lookupEmailByDniMock.mockResolvedValue("real@example.com");
    const res = await POST(makeRequest({ identifier: "12345678" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ email: "real@example.com" });
    expect(lookupEmailByDniMock).toHaveBeenCalledWith(
      { __admin: true },
      "12345678",
    );
  });

  it("returns 200 + a synthetic email when DNI is unknown (opacity)", async () => {
    lookupEmailByDniMock.mockResolvedValue(
      "00000000@students.goldenenglish.local",
    );
    const res = await POST(makeRequest({ identifier: "00000000" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      email: "00000000@students.goldenenglish.local",
    });
  });

  it("returns 200 + the verbatim email when identifier is already email-shaped (no DB)", async () => {
    const res = await POST(makeRequest({ identifier: "User@Example.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ email: "user@example.com" });
    expect(lookupEmailByDniMock).not.toHaveBeenCalled();
  });

  it("advertises Cache-Control as private + no-store and never public", async () => {
    lookupEmailByDniMock.mockResolvedValue("x@y.com");
    const res = await POST(makeRequest({ identifier: "12345678" }));
    const cc = res.headers.get("cache-control") ?? "";
    expect(cc).toMatch(/\bprivate\b/);
    expect(cc).toMatch(/\bno-store\b/);
    expect(cc).not.toMatch(/\bpublic\b/);
  });

  it("returns 429 with Retry-After when the rate limit blocks the request", async () => {
    checkRateLimitMock.mockReturnValue({ allowed: false, retryAfterSeconds: 42 });
    const res = await POST(makeRequest({ identifier: "12345678" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("42");
    expect(lookupEmailByDniMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is missing identifier", async () => {
    const res = await POST(makeRequest({ wrong: "field" }));
    expect(res.status).toBe(400);
    expect(lookupEmailByDniMock).not.toHaveBeenCalled();
  });

  it("returns 400 when identifier is empty / whitespace", async () => {
    const res = await POST(makeRequest({ identifier: "   " }));
    expect(res.status).toBe(400);
    expect(lookupEmailByDniMock).not.toHaveBeenCalled();
  });

  it("returns 400 when JSON parsing fails", async () => {
    const req = new Request("http://localhost/api/auth/resolve-login-id", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("uses the first x-forwarded-for entry as the rate-limit IP", async () => {
    lookupEmailByDniMock.mockResolvedValue("x@y.com");
    await POST(
      makeRequest(
        { identifier: "12345678" },
        { headers: { "x-forwarded-for": "9.9.9.9, 1.1.1.1" } },
      ),
    );
    expect(checkRateLimitMock).toHaveBeenCalledWith({
      ip: "9.9.9.9",
      identifier: "12345678",
    });
  });
});
