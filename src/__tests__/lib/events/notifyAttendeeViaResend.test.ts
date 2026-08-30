/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyAttendeeViaResend } from "@/lib/events/server/notifyAttendeeViaResend";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";

vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail: vi.fn(),
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
});
