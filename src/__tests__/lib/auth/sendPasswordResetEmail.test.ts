// REGRESSION CHECK: Initial coverage for the password reset email composer.
// Asserts brand/email escaping and link insertion using the live dictionary
// templates so a copy regression in en/es is caught here.

/** @vitest-environment node */
import { describe, it, expect, vi } from "vitest";
import { sendPasswordResetEmail } from "@/lib/auth/sendPasswordResetEmail";
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

describe("sendPasswordResetEmail", () => {
  it("calls the provider with subject and html that include brand + reset link", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ ok: true });
    const result = await sendPasswordResetEmail({
      to: "user@example.com",
      resetLink: "https://app.example.com/es/reset-password?code=abc",
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
    expect(call.html).toContain(
      "https://app.example.com/es/reset-password?code=abc",
    );
    expect(call.html).toContain("user@example.com");
  });

  it("uses the English template when locale is en", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ ok: true });
    await sendPasswordResetEmail({
      to: "u@e.com",
      resetLink: "https://app/x?code=y",
      brand,
      locale: "en",
      emailProvider: { sendEmail },
    });
    const call = sendEmail.mock.calls[0][0] as { subject: string; html: string };
    expect(call.subject.toLowerCase()).toContain("reset");
    expect(call.html.toLowerCase()).toContain("reset");
  });

  it("escapes HTML in the recipient address (no markup injection)", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ ok: true });
    await sendPasswordResetEmail({
      to: '"><script>x</script>@evil.com',
      resetLink: "https://app/x?code=y",
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
    const result = await sendPasswordResetEmail({
      to: "u@e.com",
      resetLink: "https://app/x",
      brand,
      locale: "en",
      emailProvider: { sendEmail },
    });
    expect(result).toEqual({ ok: false, error: "boom" });
  });
});
