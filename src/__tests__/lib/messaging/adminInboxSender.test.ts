import { describe, expect, it } from "vitest";
import { isAdminInboxSender } from "@/lib/messaging/adminInboxSender";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

describe("isAdminInboxSender", () => {
  it("rejects a sender with no role", () => {
    expect(isAdminInboxSender(undefined, PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID)).toBe(false);
  });

  it("accepts the public site contact sender", () => {
    expect(isAdminInboxSender("site_contact", PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID)).toBe(true);
  });

  it("rejects a site contact row that is not the public sender", () => {
    expect(isAdminInboxSender("site_contact", "other-id")).toBe(false);
  });
});
