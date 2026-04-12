/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: (...a: unknown[]) => sendMock(...a) },
  })),
}));

describe("ResendEmailProvider", () => {
  const prevKey = process.env.RESEND_API_KEY;
  const prevFrom = process.env.RESEND_FROM_EMAIL;

  beforeEach(async () => {
    vi.resetModules();
    sendMock.mockReset();
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM_EMAIL = "notify@example.com";
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = prevKey;
    process.env.RESEND_FROM_EMAIL = prevFrom;
  });

  it("returns error when RESEND_API_KEY is missing", async () => {
    process.env.RESEND_API_KEY = "";
    const { ResendEmailProvider } = await import("@/lib/email/resendEmailProvider");
    const p = new ResendEmailProvider();
    const r = await p.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" });
    expect(r).toEqual({ ok: false, error: "RESEND_API_KEY missing" });
  });

  it("rejects when RESEND_FROM_EMAIL is missing", async () => {
    process.env.RESEND_FROM_EMAIL = "  ";
    const { ResendEmailProvider } = await import("@/lib/email/resendEmailProvider");
    const p = new ResendEmailProvider();
    await expect(p.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" })).rejects.toThrow(
      "RESEND_FROM_EMAIL",
    );
  });

  it("returns ok when Resend succeeds", async () => {
    sendMock.mockResolvedValue({ data: {}, error: null });
    const { ResendEmailProvider } = await import("@/lib/email/resendEmailProvider");
    const p = new ResendEmailProvider();
    const r = await p.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" });
    expect(r).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalled();
  });

  it("returns error when Resend returns error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "blocked" } });
    const { ResendEmailProvider } = await import("@/lib/email/resendEmailProvider");
    const p = new ResendEmailProvider();
    const r = await p.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" });
    expect(r).toEqual({ ok: false, error: "blocked" });
  });
});
