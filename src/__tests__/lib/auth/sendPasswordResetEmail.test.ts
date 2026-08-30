// REGRESSION CHECK: Changing this adapter must keep sendBrandedEmail + escaped vars
// so password reset never goes out as a naked dictionary HTML document.

/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendPasswordResetEmail } from "@/lib/auth/sendPasswordResetEmail";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import type { BrandPublic } from "@/lib/brand/server";

vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail: vi.fn(),
}));

const brand: BrandPublic = {
  name: "Golden English",
  legalName: "Golden English SRL",
  tagline: "tagline",
  taglineEn: "tagline en",
  legalRegistry: "",
  logoPath: "/images/logo.png",
  logoAlt: "Logo",
  faviconPath: "/favicon.ico",
  faviconBundlePrefix: null,
  contactEmail: "info@example.com",
  contactPhone: "",
  contactAddress: "",
  socialFacebook: "",
  socialInstagram: "",
  socialWhatsapp: "",
};

const sendBranded = vi.mocked(sendBrandedEmail);

describe("sendPasswordResetEmail", () => {
  const sendEmail = vi.fn();

  beforeEach(() => {
    sendBranded.mockReset();
    sendBranded.mockResolvedValue({ ok: true, fromOverride: false });
  });

  it("sends the password-reset registry template with escaped vars", async () => {
    const result = await sendPasswordResetEmail({
      to: "user@example.com",
      resetLink: "https://app.example.com/es/reset-password?code=abc",
      brand,
      locale: "es",
      emailProvider: { sendEmail },
    });
    expect(result).toEqual({ ok: true });
    expect(sendBranded).toHaveBeenCalledWith({
      to: "user@example.com",
      templateKey: "notifications.password_reset",
      locale: "es",
      emailProvider: { sendEmail },
      vars: {
        brandName: "Golden English",
        email: "user@example.com",
        href: "https://app.example.com/es/reset-password?code=abc",
      },
    });
  });

  it("maps en locale and forwards a provider failure", async () => {
    sendBranded.mockResolvedValue({ ok: false, error: "boom" });
    const result = await sendPasswordResetEmail({
      to: "u@e.com",
      resetLink: "https://app/x",
      brand,
      locale: "en",
      emailProvider: { sendEmail },
    });
    expect(result).toEqual({ ok: false, error: "boom" });
    expect(sendBranded.mock.calls[0]?.[0]).toMatchObject({ locale: "en" });
  });

  it("escapes HTML in the recipient address before fill", async () => {
    await sendPasswordResetEmail({
      to: '"><script>x</script>@evil.com',
      resetLink: "https://app/x?code=y",
      brand,
      locale: "en",
      emailProvider: { sendEmail },
    });
    const vars = sendBranded.mock.calls[0]?.[0]?.vars as Record<string, string>;
    expect(vars.email).not.toContain("<script>x</script>");
    expect(vars.email).toContain("&lt;script&gt;");
    expect(vars.email).toContain("&quot;");
  });
});
