/** @vitest-environment node */
import { describe, it, expect, vi } from "vitest";
import { sendAdminPasswordResetNoticeEmail } from "@/lib/email/sendAdminPasswordResetNoticeEmail";
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

describe("sendAdminPasswordResetNoticeEmail", () => {
  it("calls the provider with subject + html that include brand and contact email", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ ok: true });
    const result = await sendAdminPasswordResetNoticeEmail({
      to: "user@example.com",
      brand,
      locale: "es",
      emailProvider: { sendEmail },
    });

    expect(result.ok).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const call = sendEmail.mock.calls[0][0] as {
      to: string;
      subject: string;
      html: string;
    };
    expect(call.to).toBe("user@example.com");
    expect(call.subject).toContain("Golden English");
    expect(call.html).toContain("user@example.com");
    expect(call.html).toContain("info@example.com");
  });

  it("uses the English template when locale is en", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ ok: true });
    await sendAdminPasswordResetNoticeEmail({
      to: "u@e.com",
      brand,
      locale: "en",
      emailProvider: { sendEmail },
    });
    const call = sendEmail.mock.calls[0][0] as {
      subject: string;
      html: string;
    };
    expect(call.subject.toLowerCase()).toContain("password");
    expect(call.html.toLowerCase()).toMatch(/administrator|admin/);
  });

  it("escapes HTML in the recipient address (no markup injection)", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ ok: true });
    await sendAdminPasswordResetNoticeEmail({
      to: '"><script>x</script>@evil.com',
      brand,
      locale: "en",
      emailProvider: { sendEmail },
    });
    const html = sendEmail.mock.calls[0][0].html as string;
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;");
  });

  it("forwards a non-ok result from the provider", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ ok: false, error: "boom" });
    const result = await sendAdminPasswordResetNoticeEmail({
      to: "u@e.com",
      brand,
      locale: "en",
      emailProvider: { sendEmail },
    });
    expect(result).toEqual({ ok: false, error: "boom" });
  });
});
