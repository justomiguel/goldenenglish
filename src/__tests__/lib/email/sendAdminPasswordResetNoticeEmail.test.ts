/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendAdminPasswordResetNoticeEmail } from "@/lib/email/sendAdminPasswordResetNoticeEmail";
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

describe("sendAdminPasswordResetNoticeEmail", () => {
  const sendEmail = vi.fn();

  beforeEach(() => {
    sendBranded.mockReset();
    sendBranded.mockResolvedValue({ ok: true, fromOverride: false });
  });

  it("sends the admin-reset registry template with brand and contact", async () => {
    const result = await sendAdminPasswordResetNoticeEmail({
      to: "user@example.com",
      brand,
      locale: "es",
      emailProvider: { sendEmail },
    });
    expect(result).toEqual({ ok: true });
    expect(sendBranded).toHaveBeenCalledWith({
      to: "user@example.com",
      templateKey: "notifications.admin_password_reset",
      locale: "es",
      emailProvider: { sendEmail },
      vars: {
        brandName: "Golden English",
        email: "user@example.com",
        contactEmail: "info@example.com",
      },
    });
  });

  it("maps en locale and forwards a provider failure", async () => {
    sendBranded.mockResolvedValue({ ok: false, error: "boom" });
    const result = await sendAdminPasswordResetNoticeEmail({
      to: "u@e.com",
      brand,
      locale: "en",
      emailProvider: { sendEmail },
    });
    expect(result).toEqual({ ok: false, error: "boom" });
    expect(sendBranded.mock.calls[0]?.[0]).toMatchObject({ locale: "en" });
  });

  it("escapes HTML in the recipient address before fill", async () => {
    await sendAdminPasswordResetNoticeEmail({
      to: '"><script>x</script>@evil.com',
      brand,
      locale: "en",
      emailProvider: { sendEmail },
    });
    const vars = sendBranded.mock.calls[0]?.[0]?.vars as Record<string, string>;
    expect(vars.email).not.toContain("<script>x</script>");
    expect(vars.email).toContain("&lt;script&gt;");
  });
});
