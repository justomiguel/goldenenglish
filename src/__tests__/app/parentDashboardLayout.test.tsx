import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactElement } from "react";
import type { DashboardActor } from "@/lib/dashboard/viewAsTypes";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

const { redirectMock, getDashboardActorMock, loadMerchEnabled, state } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  getDashboardActorMock: vi.fn(),
  loadMerchEnabled: vi.fn(),
  state: { userId: "parent-1", role: "parent" },
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

vi.mock("@/lib/parent/loadParentFocusCatalog", () => ({
  loadParentFocusCatalog: async () => ({ students: [], sectionsByStudentId: {} }),
}));

vi.mock("@/lib/parent/resolveParentFocus", () => ({
  resolveParentFocus: () => ({ studentId: null, sectionId: null }),
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
          maybeSingle: async () => ({ data: { role: state.role } }),
        }),
      }),
    }),
  }),
}));

import ParentDashboardLayout from "@/app/[locale]/dashboard/parent/layout";

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

describe("ParentDashboardLayout", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getDashboardActorMock.mockReset();
    loadMerchEnabled.mockReset();
    loadMerchEnabled.mockResolvedValue(false);
    state.userId = "parent-1";
    state.role = "parent";
    getDashboardActorMock.mockResolvedValue(actor());
  });

  it("lets an admin viewing as a parent into the parent portal", async () => {
    state.userId = "admin-1";
    state.role = "admin";
    getDashboardActorMock.mockResolvedValue(
      actor({
        sessionUserId: "admin-1",
        viewerId: "par-1",
        isAdmin: true,
        viewAs: { id: "par-1", displayName: "Lucía Gómez", role: "parent" },
      }),
    );

    const element = (await ParentDashboardLayout({
      children: <p>Parent content</p>,
      params: Promise.resolve({ locale: "en" }),
    })) as ReactElement<{ viewAs: { id: string } | null }>;

    expect(redirectMock).not.toHaveBeenCalled();
    expect(element.props.viewAs).toEqual({
      id: "par-1",
      displayName: "Lucía Gómez",
      role: "parent",
    });
  });

  it("sends an admin without view-as back to the dashboard index", async () => {
    state.userId = "admin-1";
    state.role = "admin";
    getDashboardActorMock.mockResolvedValue(
      actor({ sessionUserId: "admin-1", viewerId: "admin-1", isAdmin: true }),
    );

    await ParentDashboardLayout({
      children: <p>Parent content</p>,
      params: Promise.resolve({ locale: "en" }),
    });

    expect(redirectMock).toHaveBeenCalledWith("/en/dashboard");
  });
});
