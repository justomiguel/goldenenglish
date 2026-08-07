import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
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
  it("passes the student nav and chrome dictionaries to the shell", async () => {
    const element = (await StudentDashboardLayout({
      children: <p>Student content</p>,
      params: Promise.resolve({ locale: "en" }),
    })) as ReactElement<Record<string, unknown>>;

    expect(redirectMock).not.toHaveBeenCalled();
    expect(element.props.navDict).toBe(dictEn.dashboard.studentNav);
    expect(element.props.chromeLabels).toBe(dictEn.dashboard.studentChrome);
    expect(element.props.baseHref).toBe("/en/dashboard/student");
    expect(element.props.includePayments).toBe(true);
  });
});
