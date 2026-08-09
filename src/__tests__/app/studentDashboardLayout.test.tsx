import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import type { PortalShellConfig } from "@/lib/portal/portalShellTypes";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: async () => dictEn,
}));

vi.mock("@/lib/brand/server", () => ({
  getBrandForRequest: async () => mockBrandPublic,
}));

vi.mock("@/lib/profile/getProfilePermissions", () => ({
  getProfilePermissions: async () => ({ canAccessPaymentsModule: true }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "student-1" } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { role: "student" } }),
        }),
      }),
    }),
  }),
}));

import StudentDashboardLayout from "@/app/[locale]/dashboard/student/layout";

describe("StudentDashboardLayout", () => {
  it("drives the portal shell with the student's own config", async () => {
    const element = (await StudentDashboardLayout({
      children: <p>Student content</p>,
      params: Promise.resolve({ locale: "en" }),
    })) as ReactElement<{ config: PortalShellConfig }>;

    expect(redirectMock).not.toHaveBeenCalled();
    const { config } = element.props;
    expect(config.baseHref).toBe("/en/dashboard/student");
    expect(config.brandBadge).toBe(dictEn.dashboard.studentChrome.badge);
    expect(config.destinations.map((d) => d.id)).toEqual([
      "home",
      "course",
      "payments",
      "messages",
    ]);
    expect(config.subjectGroups).toEqual([]);
  });
});
