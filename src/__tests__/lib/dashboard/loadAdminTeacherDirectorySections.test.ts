import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminTeacherDirectorySections } from "@/lib/dashboard/loadAdminTeacherDirectorySections";

function teacherClient(opts: {
  leads?: Array<{ id: string; name: string; teacher_id: string }>;
  assistants?: Array<{ assistant_id: string; section_id: string }>;
  assistantSections?: Array<{ id: string; name: string }>;
  leadError?: { message: string } | null;
  assistantError?: { message: string } | null;
}): SupabaseClient {
  return {
    from: vi.fn((table: string) => {
      if (table === "academic_sections") {
        return {
          select: (cols: string) => {
            if (cols.includes("teacher_id")) {
              return {
                in: () => ({
                  is: () =>
                    Promise.resolve({
                      data: opts.leads ?? [],
                      error: opts.leadError ?? null,
                    }),
                }),
              };
            }
            return {
              in: () => ({
                is: () =>
                  Promise.resolve({
                    data: opts.assistantSections ?? [],
                    error: null,
                  }),
              }),
            };
          },
        };
      }
      if (table === "academic_section_assistants") {
        return {
          select: () => ({
            in: () =>
              Promise.resolve({
                data: opts.assistants ?? [],
                error: opts.assistantError ?? null,
              }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    }),
  } as unknown as SupabaseClient;
}

describe("loadAdminTeacherDirectorySections", () => {
  it("returns empty map when there are no teacher ids", async () => {
    const from = vi.fn();
    const map = await loadAdminTeacherDirectorySections(
      { from } as unknown as SupabaseClient,
      [],
    );
    expect(map.size).toBe(0);
    expect(from).not.toHaveBeenCalled();
  });

  it("merges lead and assistant sections and dedupes the same section", async () => {
    const map = await loadAdminTeacherDirectorySections(
      teacherClient({
        leads: [
          { id: "sec-lead", name: "A1 Morning", teacher_id: "t1" },
          { id: "sec-shared", name: "B1 Lab", teacher_id: "t1" },
        ],
        assistants: [
          { assistant_id: "t1", section_id: "sec-shared" },
          { assistant_id: "t1", section_id: "sec-asst" },
          { assistant_id: "t2", section_id: "sec-asst" },
        ],
        assistantSections: [
          { id: "sec-shared", name: "B1 Lab" },
          { id: "sec-asst", name: "C1 Evening" },
        ],
      }),
      ["t1", "t2"],
    );

    expect(map.get("t1")?.map((s) => s.id).sort()).toEqual([
      "sec-asst",
      "sec-lead",
      "sec-shared",
    ]);
    expect(map.get("t1")?.map((s) => s.name).sort()).toEqual([
      "A1 Morning",
      "B1 Lab",
      "C1 Evening",
    ]);
    expect(map.get("t2")).toEqual([
      { id: "sec-asst", name: "C1 Evening", cohortId: null, discountPercent: null },
    ]);
  });
});
