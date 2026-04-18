/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";

interface FakeRow {
  template_key: string;
  locale: string;
  subject: string;
  body_html: string;
  updated_at: string;
  updated_by: string | null;
}

let nextRow: FakeRow | null = null;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: nextRow, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/brand/server", () => ({
  getBrandPublic: () => ({
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
}));

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => new URL("https://app.test.example"),
}));

const sendEmail = vi.fn();

describe("sendBrandedEmail", () => {
  beforeEach(() => {
    nextRow = null;
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ ok: true });
  });

  it("wraps the resolved body in the branded layout and dispatches via the provider", async () => {
    const { sendBrandedEmail } = await import("@/lib/email/templates/sendBrandedEmail");
    const r = await sendBrandedEmail({
      to: "user@example.com",
      templateKey: "messaging.teacher_new",
      locale: "es",
      emailProvider: { sendEmail },
      vars: { senderName: "Ann", messagePreview: "Hi", href: "https://x.test" },
    });
    expect(r.ok).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const call = sendEmail.mock.calls[0][0] as {
      to: string;
      subject: string;
      html: string;
    };
    expect(call.to).toBe("user@example.com");
    expect(call.subject).toBe("Nuevo mensaje del portal");
    expect(call.html).toContain("Test Institute");
    expect(call.html).toContain('src="https://app.test.example/images/logo.png"');
    expect(call.html).toContain("<strong>Ann</strong>");
  });

  it("uses the DB override subject/body when present", async () => {
    nextRow = {
      template_key: "messaging.teacher_new",
      locale: "es",
      subject: "Asunto override",
      body_html: "<p>Body override</p>",
      updated_at: "2026-04-01T00:00:00Z",
      updated_by: null,
    };
    const { sendBrandedEmail } = await import("@/lib/email/templates/sendBrandedEmail");
    const r = await sendBrandedEmail({
      to: "user@example.com",
      templateKey: "messaging.teacher_new",
      locale: "es",
      emailProvider: { sendEmail },
    });
    expect(r.ok && r.fromOverride).toBe(true);
    const call = sendEmail.mock.calls[0][0] as { subject: string; html: string };
    expect(call.subject).toBe("Asunto override");
    expect(call.html).toContain("<p>Body override</p>");
  });

  it("returns ok:false with unknown_template_key for an unknown key without calling the provider", async () => {
    const { sendBrandedEmail } = await import("@/lib/email/templates/sendBrandedEmail");
    const r = await sendBrandedEmail({
      to: "user@example.com",
      templateKey: "does.not.exist",
      locale: "es",
      emailProvider: { sendEmail },
    });
    expect(r).toEqual({ ok: false, error: "unknown_template_key" });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("propagates provider failure as ok:false", async () => {
    sendEmail.mockResolvedValueOnce({ ok: false, error: "rate_limited" });
    const { sendBrandedEmail } = await import("@/lib/email/templates/sendBrandedEmail");
    const r = await sendBrandedEmail({
      to: "user@example.com",
      templateKey: "messaging.teacher_new",
      locale: "es",
      emailProvider: { sendEmail },
      vars: { senderName: "x", messagePreview: "x", href: "x" },
    });
    expect(r).toEqual({ ok: false, error: "rate_limited" });
  });
});
