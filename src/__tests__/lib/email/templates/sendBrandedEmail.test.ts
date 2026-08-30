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

const { recordEmailSendStaffNotice, clearEmailSendStaffNotice } = vi.hoisted(() => ({
  recordEmailSendStaffNotice: vi.fn(),
  clearEmailSendStaffNotice: vi.fn(),
}));

vi.mock("@/lib/email/emailSendStaffNotice", () => ({
  recordEmailSendStaffNotice,
  clearEmailSendStaffNotice,
}));

const sendEmail = vi.fn();
const OPEN_GATE = { map: {}, classRemindersEnabled: true } as const;

describe("sendBrandedEmail", () => {
  beforeEach(() => {
    nextRow = null;
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ ok: true });
    recordEmailSendStaffNotice.mockReset();
    clearEmailSendStaffNotice.mockReset();
  });

  it("wraps the resolved body in the branded layout and dispatches via the provider", async () => {
    const { sendBrandedEmail } = await import("@/lib/email/templates/sendBrandedEmail");
    const r = await sendBrandedEmail({
      to: "user@example.com",
      templateKey: "messaging.teacher_new",
      locale: "es",
      emailProvider: { sendEmail },
      emailSendGate: OPEN_GATE,
      vars: { senderName: "Ann", messagePreview: "Hi", href: "https://x.test" },
    });
    expect(r.ok).toBe(true);
    expect(clearEmailSendStaffNotice).toHaveBeenCalledTimes(1);
    expect(recordEmailSendStaffNotice).not.toHaveBeenCalled();
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
      emailSendGate: OPEN_GATE,
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
      emailSendGate: OPEN_GATE,
    });
    expect(r).toEqual({ ok: false, error: "unknown_template_key" });
    expect(recordEmailSendStaffNotice).toHaveBeenCalledWith({
      templateKey: "does.not.exist",
      reason: "unknown_template_key",
    });
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
      emailSendGate: OPEN_GATE,
      vars: { senderName: "x", messagePreview: "x", href: "x" },
    });
    expect(r).toEqual({ ok: false, error: "rate_limited" });
    expect(recordEmailSendStaffNotice).toHaveBeenCalledWith({
      templateKey: "messaging.teacher_new",
      reason: "provider_error",
    });
    expect(clearEmailSendStaffNotice).not.toHaveBeenCalled();
  });

  it("skips the provider when the product email is disabled", async () => {
    const { sendBrandedEmail } = await import("@/lib/email/templates/sendBrandedEmail");
    const r = await sendBrandedEmail({
      to: "user@example.com",
      templateKey: "churn.inactivity",
      locale: "es",
      emailProvider: { sendEmail },
      emailSendGate: { map: { "churn.inactivity": false }, classRemindersEnabled: true },
    });
    expect(r).toEqual({ ok: true, skipped: true });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("logs send, skip, and provider failure without the mailbox", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendBrandedEmail } = await import("@/lib/email/templates/sendBrandedEmail");

    await sendBrandedEmail({
      to: "owner@institute.com",
      templateKey: "messaging.teacher_new",
      locale: "es",
      emailProvider: { sendEmail },
      emailSendGate: OPEN_GATE,
      vars: { senderName: "Ann", messagePreview: "Hi", href: "https://x.test" },
    });
    const sentPayload = info.mock.calls.find((c) => c[1] === "sendBrandedEmail")?.[2] as
      | Record<string, unknown>
      | undefined;
    expect(sentPayload).toMatchObject({
      kind: "email_send",
      outcome: "sent",
      templateKey: "messaging.teacher_new",
      locale: "es",
      toDomain: "institute.com",
      toSynthetic: false,
    });
    expect(JSON.stringify(sentPayload)).not.toContain("owner@");

    await sendBrandedEmail({
      to: "owner@institute.com",
      templateKey: "churn.inactivity",
      locale: "es",
      emailProvider: { sendEmail },
      emailSendGate: { map: { "churn.inactivity": false }, classRemindersEnabled: true },
    });
    const skipPayload = warn.mock.calls.find((c) => c[1] === "sendBrandedEmail")?.[2] as
      | Record<string, unknown>
      | undefined;
    expect(skipPayload).toMatchObject({
      kind: "email_send",
      outcome: "skipped",
      reason: "gate_disabled",
      templateKey: "churn.inactivity",
    });

    sendEmail.mockResolvedValueOnce({ ok: false, error: "domain not verified" });
    await sendBrandedEmail({
      to: "owner@institute.com",
      templateKey: "messaging.teacher_new",
      locale: "es",
      emailProvider: { sendEmail },
      emailSendGate: OPEN_GATE,
      vars: { senderName: "x", messagePreview: "x", href: "x" },
    });
    const failPayload = error.mock.calls.find((c) => c[1] === "sendBrandedEmail")?.[2] as
      | Record<string, unknown>
      | undefined;
    expect(failPayload).toMatchObject({
      kind: "email_send",
      outcome: "failed",
      reason: "provider_error",
      error: "domain not verified",
      templateKey: "messaging.teacher_new",
      toDomain: "institute.com",
    });
    expect(JSON.stringify(failPayload)).not.toContain("owner@");

    info.mockRestore();
    warn.mockRestore();
    error.mockRestore();
  });

  it("skips class-reminder email when the class-reminders site flag is off", async () => {
    const { sendBrandedEmail } = await import("@/lib/email/templates/sendBrandedEmail");
    const r = await sendBrandedEmail({
      to: "user@example.com",
      templateKey: "notifications.class_reminder_prep",
      locale: "es",
      emailProvider: { sendEmail },
      emailSendGate: { map: {}, classRemindersEnabled: false },
    });
    expect(r).toEqual({ ok: true, skipped: true });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
