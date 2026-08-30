/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/brand/server", () => ({
  getBrandForRequest: vi.fn(() =>
    Promise.resolve({
      name: "Test Institute",
      legalName: "Test Institute LLC",
      logoPath: "/images/logo.png",
      logoAlt: "Logo",
      contactEmail: "hi@test.example",
      contactPhone: "",
      contactAddress: "Av. Siempre Viva 742",
      socialFacebook: "",
      socialInstagram: "",
      socialWhatsapp: "",
      tagline: "",
      taglineEn: "",
      legalRegistry: "",
      faviconPath: "",
    }),
  ),
}));

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => new URL("https://app.test.example"),
}));

describe("sendWrappedHtmlEmail", () => {
  const sendEmail = vi.fn();

  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ ok: true });
  });

  it("wraps the body fragment in the branded layout before sending", async () => {
    const { sendWrappedHtmlEmail } = await import(
      "@/lib/email/templates/sendWrappedHtmlEmail"
    );
    const r = await sendWrappedHtmlEmail({
      to: "ana@example.com",
      subject: "Aviso",
      bodyHtml: "<p>Hola Ana</p>",
      locale: "es",
      emailProvider: { sendEmail },
    });
    expect(r).toEqual({ ok: true });
    const call = sendEmail.mock.calls[0][0] as {
      to: string;
      subject: string;
      html: string;
      cc?: string[];
    };
    expect(call.to).toBe("ana@example.com");
    expect(call.subject).toBe("Aviso");
    expect(call.html).toContain("Test Institute");
    expect(call.html).toContain('src="https://app.test.example/images/logo.png"');
    expect(call.html).toContain("<p>Hola Ana</p>");
    expect(call.html).toContain("<!DOCTYPE html>");
  });

  it("forwards cc and a provider failure", async () => {
    sendEmail.mockResolvedValue({ ok: false, error: "boom" });
    const { sendWrappedHtmlEmail } = await import(
      "@/lib/email/templates/sendWrappedHtmlEmail"
    );
    const r = await sendWrappedHtmlEmail({
      to: "from@example.com",
      subject: "CC",
      bodyHtml: "<p>x</p>",
      locale: "en",
      cc: ["ana@example.com"],
      emailProvider: { sendEmail },
    });
    expect(r).toEqual({ ok: false, error: "boom" });
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      to: "from@example.com",
      cc: ["ana@example.com"],
    });
  });
});
