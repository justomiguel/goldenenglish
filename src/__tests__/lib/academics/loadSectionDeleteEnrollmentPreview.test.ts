import { describe, expect, it, vi } from "vitest";
import { loadSectionDeleteEnrollmentPreview } from "@/lib/academics/loadSectionDeleteEnrollmentPreview";

describe("loadSectionDeleteEnrollmentPreview", () => {
  it("maps enrollment rows from the section roster join", async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [
        {
          id: "e1",
          status: "active",
          student_id: "s1",
          profiles: { first_name: "Luis", last_name: "García" },
        },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { from } as never;

    const r = await loadSectionDeleteEnrollmentPreview(supabase, "sec-1");

    expect(from).toHaveBeenCalledWith("section_enrollments");
    expect(select).toHaveBeenCalledWith(
      "id, status, student_id, profiles!student_id(first_name,last_name)",
    );
    expect(eq).toHaveBeenCalledWith("section_id", "sec-1");
    expect(r).toEqual({
      ok: true,
      enrollments: [{ id: "e1", studentId: "s1", label: "García Luis", status: "active" }],
    });
  });

  it("returns ok false when the query fails", async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const supabase = { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) }) } as never;

    await expect(loadSectionDeleteEnrollmentPreview(supabase, "sec-1")).resolves.toEqual({
      ok: false,
    });
  });
});
