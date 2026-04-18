// REGRESSION CHECK: Initial coverage. Critical invariants:
//  - never reveal whether the email exists (always returns ok=true unless the
//    payload is malformed),
//  - delegate the actual send to the injected EmailProvider,
//  - pass the configured redirectTo so Supabase will bounce users to our page.

/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requestPasswordReset,
  isValidResetEmail,
} from "@/lib/auth/requestPasswordReset";
import type { BrandPublic } from "@/lib/brand/server";

const brand: BrandPublic = {
  name: "Golden English",
  legalName: "Golden English SRL",
  tagline: "tagline",
  taglineEn: "tagline en",
  legalRegistry: "",
  logoPath: "/images/logo.png",
  logoAlt: "Logo",
  faviconPath: "/favicon.ico",
  contactEmail: "info@example.com",
  contactPhone: "",
  contactAddress: "",
  socialFacebook: "",
  socialInstagram: "",
  socialWhatsapp: "",
};

interface AdminMock {
  generateLink: ReturnType<typeof vi.fn>;
}

function buildAdminClient(generateLink: AdminMock["generateLink"]) {
  return {
    auth: { admin: { generateLink } },
  } as unknown as Parameters<typeof requestPasswordReset>[0]["adminClient"];
}

describe("isValidResetEmail", () => {
  it.each([
    ["a@b.co", true],
    ["user.name+tag@example.com", true],
    ["", false],
    ["a", false],
    ["a@b", false],
    ["@b.co", false],
    ["a b@c.co", false],
  ])("validates %s -> %s", (input, expected) => {
    expect(isValidResetEmail(input)).toBe(expected);
  });
});

describe("requestPasswordReset", () => {
  const sendEmail = vi.fn().mockResolvedValue({ ok: true });

  beforeEach(() => {
    sendEmail.mockClear();
    sendEmail.mockResolvedValue({ ok: true });
  });

  it("rejects malformed email addresses without contacting Supabase", async () => {
    const generateLink = vi.fn();
    const result = await requestPasswordReset({
      email: "not-an-email",
      locale: "es",
      redirectTo: "https://app/es/reset-password",
      brand,
      adminClient: buildAdminClient(generateLink),
      emailProvider: { sendEmail },
    });
    expect(result).toEqual({ ok: false, reason: "invalid_email" });
    expect(generateLink).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends the email when Supabase returns an action link", async () => {
    const generateLink = vi.fn().mockResolvedValue({
      data: {
        properties: { action_link: "https://supa/verify?token=t&type=recovery" },
      },
      error: null,
    });
    const result = await requestPasswordReset({
      email: " User@Example.com ",
      locale: "es",
      redirectTo: "https://app/es/reset-password",
      brand,
      adminClient: buildAdminClient(generateLink),
      emailProvider: { sendEmail },
    });
    expect(result).toEqual({ ok: true });
    expect(generateLink).toHaveBeenCalledWith({
      type: "recovery",
      email: "User@Example.com",
      options: { redirectTo: "https://app/es/reset-password" },
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const call = sendEmail.mock.calls[0][0] as { to: string; html: string };
    expect(call.to).toBe("User@Example.com");
    expect(call.html).toContain(
      "https://supa/verify?token=t&amp;type=recovery",
    );
  });

  it("returns ok and skips email when Supabase reports an error (no existence leak)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const generateLink = vi.fn().mockResolvedValue({
      data: { properties: null },
      error: { message: "User not found", status: 404 },
    });
    const result = await requestPasswordReset({
      email: "ghost@example.com",
      locale: "en",
      redirectTo: "https://app/en/reset-password",
      brand,
      adminClient: buildAdminClient(generateLink),
      emailProvider: { sendEmail },
    });
    expect(result).toEqual({ ok: true });
    expect(sendEmail).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns ok when Supabase throws (still no leak)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const generateLink = vi.fn().mockRejectedValue(new Error("network"));
    const result = await requestPasswordReset({
      email: "user@example.com",
      locale: "en",
      redirectTo: "https://app/en/reset-password",
      brand,
      adminClient: buildAdminClient(generateLink),
      emailProvider: { sendEmail },
    });
    expect(result).toEqual({ ok: true });
    expect(sendEmail).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns ok even when the email provider fails (logged, not surfaced)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const generateLink = vi.fn().mockResolvedValue({
      data: { properties: { action_link: "https://supa/x" } },
      error: null,
    });
    sendEmail.mockResolvedValueOnce({ ok: false, error: "smtp down" });
    const result = await requestPasswordReset({
      email: "user@example.com",
      locale: "en",
      redirectTo: "https://app/en/reset-password",
      brand,
      adminClient: buildAdminClient(generateLink),
      emailProvider: { sendEmail },
    });
    expect(result).toEqual({ ok: true });
    expect(sendEmail).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns ok when no action link is present in the response", async () => {
    const generateLink = vi.fn().mockResolvedValue({
      data: { properties: {} },
      error: null,
    });
    const result = await requestPasswordReset({
      email: "user@example.com",
      locale: "en",
      redirectTo: "https://app/en/reset-password",
      brand,
      adminClient: buildAdminClient(generateLink),
      emailProvider: { sendEmail },
    });
    expect(result).toEqual({ ok: true });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
