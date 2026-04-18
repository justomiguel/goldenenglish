// REGRESSION CHECK: Initial coverage. Critical invariants:
//  - server action wires headers().IP into the rate limiter,
//  - rejects empty email and rate-limited callers without contacting Supabase,
//  - returns ok=true (no existence leak) when underlying use case returns ok.

/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";

const requestPasswordResetMock = vi.fn();
const rateLimitMock = vi.fn();
const headersMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: () => headersMock(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/email/getEmailProvider", () => ({
  getEmailProvider: vi.fn(() => ({ sendEmail: vi.fn() })),
}));

vi.mock("@/lib/brand/server", () => ({
  getBrandPublic: vi.fn(() => ({ name: "Golden English" })),
}));

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: vi.fn(() => new URL("https://app.example.com")),
}));

vi.mock("@/lib/auth/requestPasswordReset", () => ({
  requestPasswordReset: (...a: unknown[]) => requestPasswordResetMock(...a),
}));

vi.mock("@/lib/auth/passwordResetRateLimit", () => ({
  checkPasswordResetRateLimit: (...a: unknown[]) => rateLimitMock(...a),
}));

function buildHeaders(map: Record<string, string>): Headers {
  return new Headers(map);
}

describe("requestPasswordResetAction", () => {
  beforeEach(() => {
    requestPasswordResetMock.mockReset();
    rateLimitMock.mockReset();
    headersMock.mockReset();
    rateLimitMock.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    headersMock.mockResolvedValue(
      buildHeaders({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }),
    );
  });

  it("returns ok=false with emailRequired when input is empty", async () => {
    const { requestPasswordResetAction } = await import(
      "@/app/[locale]/forgot-password/actions"
    );
    const result = await requestPasswordResetAction("es", "   ");
    expect(result.ok).toBe(false);
    expect(rateLimitMock).not.toHaveBeenCalled();
    expect(requestPasswordResetMock).not.toHaveBeenCalled();
  });

  it("returns ok=false with rateLimited message when the limiter blocks", async () => {
    rateLimitMock.mockReturnValue({ allowed: false, retryAfterSeconds: 60 });
    const { requestPasswordResetAction } = await import(
      "@/app/[locale]/forgot-password/actions"
    );
    const result = await requestPasswordResetAction("en", "user@example.com");
    expect(result.ok).toBe(false);
    expect(requestPasswordResetMock).not.toHaveBeenCalled();
  });

  it("uses the first x-forwarded-for entry as the rate limit IP", async () => {
    requestPasswordResetMock.mockResolvedValue({ ok: true });
    const { requestPasswordResetAction } = await import(
      "@/app/[locale]/forgot-password/actions"
    );
    await requestPasswordResetAction("es", "user@example.com");
    expect(rateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ ip: "1.2.3.4", email: "user@example.com" }),
    );
  });

  it("forwards a redirectTo URL pointing to the locale-specific reset page", async () => {
    requestPasswordResetMock.mockResolvedValue({ ok: true });
    const { requestPasswordResetAction } = await import(
      "@/app/[locale]/forgot-password/actions"
    );
    await requestPasswordResetAction("en", "user@example.com");
    expect(requestPasswordResetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        locale: "en",
        redirectTo: "https://app.example.com/en/reset-password",
      }),
    );
  });

  it("returns ok=true when the use case returns ok=true", async () => {
    requestPasswordResetMock.mockResolvedValue({ ok: true });
    const { requestPasswordResetAction } = await import(
      "@/app/[locale]/forgot-password/actions"
    );
    const result = await requestPasswordResetAction("es", "user@example.com");
    expect(result).toEqual({ ok: true });
  });

  it("returns ok=false with emailInvalid when the use case rejects the address", async () => {
    requestPasswordResetMock.mockResolvedValue({
      ok: false,
      reason: "invalid_email",
    });
    const { requestPasswordResetAction } = await import(
      "@/app/[locale]/forgot-password/actions"
    );
    const result = await requestPasswordResetAction("es", "garbage");
    expect(result.ok).toBe(false);
  });
});
