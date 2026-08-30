import { describe, expect, it } from "vitest";
import {
  emailSendStaffNoticeIsActive,
  parseEmailSendLastFailure,
} from "@/lib/email/emailSendStaffNoticeParse";

describe("emailSendStaffNotice", () => {
  it("parses a stored failure and treats dismiss as inactive", () => {
    const raw = {
      at: "2026-08-29T14:00:00.000Z",
      templateKey: "registration.admin_received",
      reason: "provider_error",
      dismissedAt: null,
    };
    expect(parseEmailSendLastFailure(raw)).toEqual(raw);
    expect(emailSendStaffNoticeIsActive(raw)).toBe(true);
    expect(
      emailSendStaffNoticeIsActive({ ...raw, dismissedAt: "2026-08-29T15:00:00.000Z" }),
    ).toBe(false);
  });

  it("rejects junk and never requires a mailbox field", () => {
    expect(parseEmailSendLastFailure({ templateKey: "x" })).toBeNull();
    expect(parseEmailSendLastFailure(null)).toBeNull();
    const parsed = parseEmailSendLastFailure({
      at: "2026-08-29T14:00:00.000Z",
      templateKey: "messaging.teacher_new",
      reason: "unknown_template_key",
      dismissedAt: null,
      to: "owner@institute.com",
    });
    expect(parsed).toEqual({
      at: "2026-08-29T14:00:00.000Z",
      templateKey: "messaging.teacher_new",
      reason: "unknown_template_key",
      dismissedAt: null,
    });
  });
});
