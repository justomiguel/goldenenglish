// REGRESSION CHECK: View-as on the teacher calendar must load birthdays for the
// subject teacher. Passing the admin session id shows the admin birthday scope.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { DashboardActor } from "@/lib/dashboard/viewAsTypes";

const { redirectMock, getDashboardActorMock, buildPayloadMock, state } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  getDashboardActorMock: vi.fn(),
  buildPayloadMock: vi.fn(),
  state: { allowed: true },
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirectMock(url);
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock("@/lib/metadata/buildPageMetadata", () => ({
  buildPageMetadata: vi.fn(async () => ({})),
}));

vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: async () => ({
    dashboard: {
      teacherNav: { calendar: "Calendar" },
      birthdays: {
        calendarEventTitle: "Birthday",
        icsPrefix: "Birthday",
        icsDescription: "Student birthday",
      },
      portalCalendar: { title: "Calendar" },
    },
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "admin-1" } } }),
    },
  }),
}));

vi.mock("@/lib/academics/resolveTeacherPortalAccess", () => ({
  resolveTeacherPortalAccess: async () => ({ allowed: state.allowed, profileRole: "admin" }),
}));

vi.mock("@/lib/auth/resolveIsAdminSession", () => ({
  resolveIsAdminSession: async () => true,
}));

vi.mock("@/lib/dashboard/getDashboardActor", () => ({
  getDashboardActor: () => getDashboardActorMock(),
}));

vi.mock("@/lib/calendar/buildPortalCalendarPagePayload", () => ({
  buildPortalCalendarPagePayload: (...args: unknown[]) => buildPayloadMock(...args),
}));

vi.mock("@/lib/site/requestPublicUrl", () => ({
  getRequestPublicSiteUrl: async () => ({ origin: "http://localhost:3000" }),
}));

vi.mock("@/components/organisms/PortalCalendarEntry", () => ({
  PortalCalendarEntry: () => null,
}));

function actor(viewAsId: string | null): DashboardActor {
  return {
    sessionUserId: "admin-1",
    isAdmin: true,
    viewerId: viewAsId ?? "admin-1",
    viewAs: viewAsId
      ? { id: viewAsId, displayName: "García, Ana", role: "teacher" }
      : null,
    clearCookie: false,
    redirectAdminEnded: false,
  };
}

describe("TeacherCalendarPage birthdays viewer", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getDashboardActorMock.mockReset();
    buildPayloadMock.mockReset();
    state.allowed = true;
    buildPayloadMock.mockResolvedValue({
      events: [],
      teacherOptions: [],
      roomOptions: [],
      feedToken: null,
    });
  });

  it("loads the calendar for the View-As teacher, not the admin session", async () => {
    getDashboardActorMock.mockResolvedValue(actor("teacher-9"));
    const { default: TeacherCalendarPage } = await import(
      "@/app/[locale]/dashboard/teacher/calendar/page"
    );
    const element = (await TeacherCalendarPage({
      params: Promise.resolve({ locale: "es" }),
    })) as ReactElement<{ viewerId?: string }>;
    expect(buildPayloadMock).toHaveBeenCalledWith(
      expect.anything(),
      "teacher-9",
      "teacher",
      expect.objectContaining({ locale: "es" }),
    );
    expect(element.props.viewerId).toBe("teacher-9");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("keeps the signed-in teacher when View-As is off", async () => {
    getDashboardActorMock.mockResolvedValue(actor(null));
    const { default: TeacherCalendarPage } = await import(
      "@/app/[locale]/dashboard/teacher/calendar/page"
    );
    const element = (await TeacherCalendarPage({
      params: Promise.resolve({ locale: "es" }),
    })) as ReactElement<{ viewerId?: string }>;
    expect(buildPayloadMock).toHaveBeenCalledWith(
      expect.anything(),
      "admin-1",
      "teacher",
      expect.anything(),
    );
    expect(element.props.viewerId).toBe("admin-1");
  });
});
