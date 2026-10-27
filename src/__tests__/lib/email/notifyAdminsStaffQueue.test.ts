/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendRegistrationAdminEmails, getRequestPublicSiteUrl } = vi.hoisted(() => ({
  sendRegistrationAdminEmails: vi.fn(),
  getRequestPublicSiteUrl: vi.fn(async () => ({ origin: "https://school.test" })),
}));

vi.mock("@/lib/email/registrationIntakeEmails", () => ({
  sendRegistrationAdminEmails,
}));
vi.mock("@/lib/site/requestPublicUrl", () => ({
  getRequestPublicSiteUrl,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { notifyAdminsBlogPendingReview } from "@/lib/email/notifyAdminsBlogReview";
import { notifyAdminsRegistrationPlacement } from "@/lib/email/notifyAdminsRegistrationPlacement";

function blogClient(rows: { locale: string; title: string }[]) {
  return {
    from: () => ({
      select: () => ({
        eq: async () => ({ data: rows, error: null }),
      }),
    }),
  };
}

function leadClient(input: {
  lead: Record<string, unknown> | null;
  sectionName?: string | null;
}) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data:
              table === "academic_sections"
                ? input.sectionName
                  ? { name: input.sectionName }
                  : null
                : input.lead,
            error: null,
          }),
        }),
      }),
    }),
  };
}

describe("admin staff queue mails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendRegistrationAdminEmails.mockResolvedValue(undefined);
    getRequestPublicSiteUrl.mockResolvedValue({ origin: "https://school.test" });
  });

  it("mails admins when a teacher article waits for review", async () => {
    await notifyAdminsBlogPendingReview({
      supabase: blogClient([
        { locale: "en", title: "Verbs" },
        { locale: "es", title: "Verbos" },
      ]) as never,
      articleId: "article-1",
      locale: "es",
    });

    expect(sendRegistrationAdminEmails).toHaveBeenCalledWith({
      locale: "es",
      templateKey: "blog.admin_pending_review",
      vars: {
        articleTitle: "Verbos",
        adminUrl: "https://school.test/es/dashboard/admin/cms/blog/review",
      },
    });
  });

  it("mails admins when a paid enrollment has no section", async () => {
    const admin = leadClient({
      lead: {
        first_name: "Ana",
        last_name: "Pérez",
        dni: "123",
        birth_date: "2014-03-02",
        tutor_name: null,
        preferred_section_id: null,
        fee_snapshot: { total: 15000, currency: "CLP" },
      },
    });

    await notifyAdminsRegistrationPlacement({
      admin: admin as never,
      locale: "es",
      registrationId: "reg-1",
      kind: "needs_section",
    });

    expect(sendRegistrationAdminEmails).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: "registration.admin_needs_section",
        vars: expect.objectContaining({
          studentName: "Pérez Ana",
          sectionName: "—",
        }),
      }),
    );
  });

  it("mails admins when the paid section is full", async () => {
    const admin = leadClient({
      lead: {
        first_name: "Ana",
        last_name: "Pérez",
        dni: "123",
        birth_date: "2014-03-02",
        tutor_name: "Luis",
        preferred_section_id: "sec-1",
        fee_snapshot: { total: 15000, currency: "CLP" },
      },
      sectionName: "A2",
    });

    await notifyAdminsRegistrationPlacement({
      admin: admin as never,
      locale: "en",
      registrationId: "reg-1",
      kind: "section_full",
    });

    expect(sendRegistrationAdminEmails).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "en",
        templateKey: "registration.admin_section_full",
        vars: expect.objectContaining({
          sectionName: "A2",
          adminUrl: "https://school.test/en/dashboard/admin/registrations",
        }),
      }),
    );
  });
});
