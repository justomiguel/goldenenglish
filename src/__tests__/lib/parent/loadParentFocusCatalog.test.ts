/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadParentFocusCatalog } from "@/lib/parent/loadParentFocusCatalog";

vi.mock("@/lib/auth/listTutorStudentsWithFinance", () => ({
  listTutorStudentsWithFinance: vi.fn(async () => [
    {
      studentId: "s1",
      firstName: "Ana",
      lastName: "Lopez",
      displayName: "Lopez, Ana",
      isMinor: true,
      financialAccessActive: true,
      financialAccessRevokedAt: null,
    },
  ]),
}));

function chain(resolved: { data: unknown; error: unknown }) {
  const self = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    in: vi.fn(() => self),
    order: vi.fn(() => self),
    limit: vi.fn().mockResolvedValue(resolved),
    then(onFulfilled: (v: unknown) => unknown) {
      return Promise.resolve(resolved).then(onFulfilled);
    },
  };
  return self;
}

describe("loadParentFocusCatalog", () => {
  it("returns empty catalog when tutorId is empty", async () => {
    const supabase = { from: vi.fn() } as unknown as SupabaseClient;
    await expect(loadParentFocusCatalog(supabase, "")).resolves.toEqual({
      students: [],
      sectionsByStudentId: {},
    });
  });

  it("builds class labels from cohort and section name", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "section_enrollments") {
          return chain({
            data: [
              { student_id: "s1", section_id: "sec-b" },
              { student_id: "s1", section_id: "sec-a" },
            ],
            error: null,
          });
        }
        if (table === "academic_sections") {
          return chain({
            data: [
              {
                id: "sec-a",
                name: "A1",
                academic_cohorts: { name: "Teens" },
              },
              {
                id: "sec-b",
                name: "B1",
                academic_cohorts: { name: "Kids" },
              },
            ],
            error: null,
          });
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    const catalog = await loadParentFocusCatalog(supabase, "tutor-1");
    expect(catalog.students).toEqual([
      { studentId: "s1", displayName: "Lopez, Ana" },
    ]);
    expect(catalog.sectionsByStudentId.s1.map((s) => s.classLabel)).toEqual([
      "Kids — B1",
      "Teens — A1",
    ]);
  });
});
