// REGRESSION CHECK: Accepting a web lead must not enroll a section outside the inscriptions cohort.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertAdmin: vi.fn(),
  enroll: vi.fn(),
  createAdmin: vi.fn(),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mocks.assertAdmin(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mocks.createAdmin(),
}));
vi.mock("@/app/[locale]/dashboard/admin/academic/enrollmentActions", () => ({
  enrollStudentInSectionAction: (...args: unknown[]) => mocks.enroll(...args),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerAuthzDenied: vi.fn(),
  logServerWarn: vi.fn(),
}));

import { enrollAcceptedRegistrationSectionAction } from "@/app/[locale]/dashboard/admin/registrations/enrollAcceptedRegistrationSectionAction";

const WEB = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SECTION = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const STUDENT = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function adminFor(sectionCohortId: string) {
  return {
    from(table: string) {
      if (table === "academic_sections") {
        return {
          select: () => ({
            eq: () => ({
              is: () => ({
                maybeSingle: async () => ({ data: { cohort_id: sectionCohortId }, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "site_settings") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { value: WEB }, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          is: () => ({
            order: async () => ({
              data: [{ id: WEB, name: "Web", is_current: true }],
              error: null,
            }),
          }),
        }),
      };
    },
  };
}

describe("enrollAcceptedRegistrationSectionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertAdmin.mockResolvedValue({ supabase: {}, user: { id: "admin-1" } });
    mocks.enroll.mockResolvedValue({ ok: true, enrollmentId: "enr-1" });
  });

  it("rejects a section outside the inscriptions cohort", async () => {
    mocks.createAdmin.mockReturnValue(adminFor(OTHER));
    const result = await enrollAcceptedRegistrationSectionAction({
      locale: "es",
      studentId: STUDENT,
      sectionId: SECTION,
    });
    expect(result).toEqual({ ok: false, code: "section_cohort_mismatch" });
    expect(mocks.enroll).not.toHaveBeenCalled();
  });
});
