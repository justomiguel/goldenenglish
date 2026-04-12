import { describe, it, expect, vi } from "vitest";
import {
  parseCefrLevelFromInterest,
  resolveCourseIdFromLevelInterest,
} from "@/lib/import/bulkImportEnrollment";

describe("parseCefrLevelFromInterest", () => {
  it("parses trimmed case-insensitive levels", () => {
    expect(parseCefrLevelFromInterest("  a1 ")).toBe("A1");
    expect(parseCefrLevelFromInterest("C2")).toBe("C2");
  });

  it("returns null for invalid or empty", () => {
    expect(parseCefrLevelFromInterest("")).toBeNull();
    expect(parseCefrLevelFromInterest(null)).toBeNull();
    expect(parseCefrLevelFromInterest("A0")).toBeNull();
    expect(parseCefrLevelFromInterest("pre-A1")).toBeNull();
  });
});

describe("resolveCourseIdFromLevelInterest", () => {
  it("queries courses with normalized level and default year", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "course-uuid" },
      error: null,
    });
    const eq3 = vi.fn().mockReturnValue({ maybeSingle });
    const eq2 = vi.fn().mockReturnValue({ eq: eq3 });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eq1 }),
      }),
    };

    const id = await resolveCourseIdFromLevelInterest(
      admin as never,
      " b1 ",
      2026,
    );
    expect(id).toBe("course-uuid");
    expect(eq1).toHaveBeenCalledWith("level", "B1");
    expect(eq2).toHaveBeenCalledWith("academic_year", 2026);
    expect(eq3).toHaveBeenCalledWith("modality", "online");
  });

  it("returns null when no row", async () => {
    const admin = {
      from: vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
    };
    const id = await resolveCourseIdFromLevelInterest(admin as never, "A2");
    expect(id).toBeNull();
  });
});
