/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyAttendeeViaResend } from "@/lib/events/server/notifyAttendeeViaResend";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";

const { loadResolvedEventEmail } = vi.hoisted(() => ({
  loadResolvedEventEmail: vi.fn(),
}));

vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail: vi.fn(),
}));

vi.mock("@/lib/events/server/loadResolvedEventEmail", () => ({
  loadResolvedEventEmail: (...args: unknown[]) => loadResolvedEventEmail(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
}));

const sendBranded = vi.mocked(sendBrandedEmail);

describe("notifyAttendeeViaResend", () => {
  beforeEach(() => {
    sendBranded.mockReset();
    sendBranded.mockResolvedValue({ ok: true, fromOverride: false });
  });

  it("sends the events registry template through sendBrandedEmail", async () => {
    const ok = await notifyAttendeeViaResend({
      to: "guest@example.com",
      templateKey: "events.registered",
      locale: "es",
    });
    expect(ok).toBe(true);
    expect(sendBranded).toHaveBeenCalledWith({
      to: "guest@example.com",
      templateKey: "events.registered",
      locale: "es",
    });
  });

  it("returns false when the branded send fails", async () => {
    sendBranded.mockResolvedValue({ ok: false, error: "missing_key" });
    const ok = await notifyAttendeeViaResend({
      to: "guest@example.com",
      templateKey: "events.reminder",
      locale: "en",
    });
    expect(ok).toBe(false);
  });

  it("sends the resolved event copy when an event id is present", async () => {
    loadResolvedEventEmail.mockResolvedValue({
      subject: "Hola",
      bodyHtml: "<p>Hola</p>",
      fromOverride: true,
    });
    const ok = await notifyAttendeeViaResend({
      to: "guest@example.com",
      templateKey: "events.registered",
      locale: "es",
      eventId: "event-1",
      flowId: "flow-1",
      vars: { firstName: "Ana" },
    });
    expect(ok).toBe(true);
    expect(sendBranded).toHaveBeenCalledWith(
      expect.objectContaining({
        content: { subject: "Hola", bodyHtml: "<p>Hola</p>", fromOverride: true },
      }),
    );
  });

  it("does not send when the event copy cannot be resolved", async () => {
    loadResolvedEventEmail.mockResolvedValue(null);
    const ok = await notifyAttendeeViaResend({
      to: "guest@example.com",
      templateKey: "events.registered",
      locale: "es",
      eventId: "event-1",
    });
    expect(ok).toBe(false);
    expect(sendBranded).not.toHaveBeenCalled();
  });

  it("passes variables when there is no event copy", async () => {
    const ok = await notifyAttendeeViaResend({
      to: "guest@example.com",
      templateKey: "events.registered",
      locale: "es",
      vars: { firstName: "Ana" },
    });
    expect(ok).toBe(true);
    expect(sendBranded).toHaveBeenCalledWith(expect.objectContaining({ vars: { firstName: "Ana" } }));
  });

  it("returns false when the send throws", async () => {
    sendBranded.mockRejectedValue(new Error("down"));
    const ok = await notifyAttendeeViaResend({
      to: "guest@example.com",
      templateKey: "events.reminder",
      locale: "pt",
    });
    expect(ok).toBe(false);
  });
});
