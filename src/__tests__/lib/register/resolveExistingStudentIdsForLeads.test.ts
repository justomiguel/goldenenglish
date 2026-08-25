import { describe, expect, it, vi } from "vitest";
import { resolveExistingStudentIdsForLeads } from "@/lib/register/resolveExistingStudentIdsForLeads";

describe("resolveExistingStudentIdsForLeads", () => {
  it("maps a lead to the student whose document matches", async () => {
    const inFn = vi.fn().mockResolvedValue({
      data: [{ id: "stu-1", role: "student", dni_or_passport: "12.345.678" }],
      error: null,
    });
    const admin = {
      from: () => ({
        select: () => ({
          eq: () => ({ in: inFn }),
        }),
      }),
    };

    const map = await resolveExistingStudentIdsForLeads(admin as never, [
      { id: "lead-1", dni: "12345678" },
      { id: "lead-2", dni: "999" },
    ]);

    expect(map.get("lead-1")).toBe("stu-1");
    expect(map.has("lead-2")).toBe(false);
  });

  it("returns empty when the query fails", async () => {
    const admin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            in: vi.fn().mockResolvedValue({ data: null, error: { message: "no" } }),
          }),
        }),
      }),
    };
    const map = await resolveExistingStudentIdsForLeads(admin as never, [
      { id: "lead-1", dni: "1" },
    ]);
    expect(map.size).toBe(0);
  });
});
