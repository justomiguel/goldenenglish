/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

const { sendBrandedEmail, createAdminClient, batchAuthEmailsForUserIds, logServerInfo } = vi.hoisted(
  () => ({
    sendBrandedEmail: vi.fn(),
    createAdminClient: vi.fn(),
    batchAuthEmailsForUserIds: vi.fn(),
    logServerInfo: vi.fn(),
  }),
);

vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient,
}));
vi.mock("@/lib/auth/batchAuthEmailsForUserIds", () => ({
  batchAuthEmailsForUserIds,
}));
vi.mock("@/lib/logging/serverActionLog", async () => {
  const actual = await vi.importActual<typeof import("@/lib/logging/serverActionLog")>(
    "@/lib/logging/serverActionLog",
  );
  return { ...actual, logServerInfo };
});

describe("sendRegistrationAdminEmails", () => {
  let profilesSelect: string;

  beforeEach(() => {
    vi.clearAllMocks();
    profilesSelect = "";
    sendBrandedEmail.mockResolvedValue({ ok: true, fromOverride: false });
    batchAuthEmailsForUserIds.mockResolvedValue(
      new Map([
        ["admin-1", "owner@institute.com"],
        [PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID, "noreply@institute.com"],
      ]),
    );
    createAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table !== "profiles") throw new Error(`unexpected table ${table}`);
        return {
          select: (cols: string) => {
            profilesSelect = cols;
            const error = /\bemail\b/.test(cols)
              ? { code: "42703", message: "column profiles.email does not exist" }
              : null;
            return {
              eq: () => ({
                limit: async () => ({
                  data: error
                    ? null
                    : [{ id: "admin-1" }, { id: PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID }],
                  error,
                }),
              }),
            };
          },
        };
      },
    });
  });

  it("loads admin ids from profiles and emails from auth, never profiles.email", async () => {
    const { sendRegistrationAdminEmails } = await import("@/lib/email/registrationIntakeEmails");
    await sendRegistrationAdminEmails({
      locale: "es",
      templateKey: "registration.admin_received",
      vars: { studentName: "Ana" },
    });

    expect(profilesSelect).not.toMatch(/\bemail\b/);
    expect(batchAuthEmailsForUserIds).toHaveBeenCalledWith(["admin-1"]);
    expect(sendBrandedEmail).toHaveBeenCalledTimes(1);
    expect(sendBrandedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@institute.com",
        templateKey: "registration.admin_received",
        locale: "es",
        vars: { studentName: "Ana" },
      }),
    );
    expect(logServerInfo).toHaveBeenCalledWith(
      "sendRegistrationAdminEmails:list",
      expect.objectContaining({
        templateKey: "registration.admin_received",
        locale: "es",
        adminIds: 1,
        authEmails: 2,
        deliverable: 1,
      }),
    );
    const listMeta = logServerInfo.mock.calls[0][1] as Record<string, unknown>;
    expect(JSON.stringify(listMeta)).not.toContain("owner@");
  });
});
