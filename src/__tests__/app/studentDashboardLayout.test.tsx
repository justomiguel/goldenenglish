import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactElement } from "react";
import type { PortalShellConfig } from "@/lib/portal/portalShellTypes";
import type { DashboardActor } from "@/lib/dashboard/viewAsTypes";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

const { redirectMock, getDashboardActorMock, loadMerchEnabled, state } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  getDashboardActorMock: vi.fn(),
  loadMerchEnabled: vi.fn(),
  state: { userId: "student-1", role: "student" },
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));
vi.mock("@/lib/shop/loadMerchEnabled", () => ({
  loadMerchEnabled: () => loadMerchEnabled(),
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

vi.mock("@/lib/dashboard/getDashboardActor", () => ({
  getDashboardActor: () => getDashboardActorMock(),
  syncViewAsCookie: vi.fn(async () => undefined),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: state.userId } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { role: state.role } }),
          maybeSingle: async () => ({ data: { role: state.role } }),
        }),
      }),
    }),
  }),
}));

import StudentDashboardLayout from "@/app/[locale]/dashboard/student/layout";

function actor(over: Partial<DashboardActor> = {}): DashboardActor {
  return {
    sessionUserId: state.userId,
    viewerId: state.userId,
    isAdmin: false,
    viewAs: null,
    redirectAdminEnded: false,
    clearCookie: false,
    ...over,
  };
}

describe("StudentDashboardLayout", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getDashboardActorMock.mockReset();
    loadMerchEnabled.mockReset();
    loadMerchEnabled.mockResolvedValue(false);
    state.userId = "student-1";
    state.role = "student";
    getDashboardActorMock.mockResolvedValue(actor());
  });

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

  it("includes shop orders when merch is enabled", async () => {
    loadMerchEnabled.mockResolvedValue(true);
    const element = (await StudentDashboardLayout({
      children: <p>Student content</p>,
      params: Promise.resolve({ locale: "en" }),
    })) as ReactElement<{ config: PortalShellConfig }>;
    expect(element.props.config.destinations.map((d) => d.id)).toEqual([
      "home",
      "course",
      "payments",
      "shop",
      "messages",
    ]);
  });

  it("lets an admin viewing as a student into the student portal", async () => {
    state.userId = "admin-1";
    state.role = "admin";
    getDashboardActorMock.mockResolvedValue(
      actor({
        sessionUserId: "admin-1",
        viewerId: "stu-1",
        isAdmin: true,
        viewAs: { id: "stu-1", displayName: "Ana Pérez", role: "student" },
      }),
    );

    const element = (await StudentDashboardLayout({
      children: <p>Student content</p>,
      params: Promise.resolve({ locale: "en" }),
    })) as ReactElement<{ viewAs: { id: string } | null }>;

    expect(redirectMock).not.toHaveBeenCalled();
    expect(element.props.viewAs).toEqual({
      id: "stu-1",
      displayName: "Ana Pérez",
      role: "student",
    });
  });

  it("sends an admin without view-as back to the dashboard index", async () => {
    state.userId = "admin-1";
    state.role = "admin";
    getDashboardActorMock.mockResolvedValue(
      actor({ sessionUserId: "admin-1", viewerId: "admin-1", isAdmin: true }),
    );

    await StudentDashboardLayout({
      children: <p>Student content</p>,
      params: Promise.resolve({ locale: "en" }),
    });

    expect(redirectMock).toHaveBeenCalledWith("/en/dashboard");
  });
});
