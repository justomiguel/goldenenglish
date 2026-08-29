import { describe, expect, it, vi } from "vitest";
import { loadParentIdsForActiveSection } from "@/lib/dashboard/loadParentIdsForActiveSection";

function thenable(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => resolve({ data, error: null }),
  };
}

describe("loadParentIdsForActiveSection", () => {
  it("returns distinct tutor ids for active enrollments", async () => {
    const from = vi.fn((table: string) => {
      if (table === "section_enrollments") {
        return thenable([{ student_id: "s1" }, { student_id: "s1" }, { student_id: "s2" }]);
      }
      return thenable([{ tutor_id: "p1" }, { tutor_id: "p1" }, { tutor_id: "p2" }]);
    });
    await expect(loadParentIdsForActiveSection({ from } as never, "sec-1")).resolves.toEqual([
      "p1",
      "p2",
    ]);
  });

  it("returns empty when the section has no students", async () => {
    const from = vi.fn(() => thenable([]));
    await expect(loadParentIdsForActiveSection({ from } as never, "sec-1")).resolves.toEqual([]);
  });
});
