import { describe, expect, it, vi } from "vitest";
import { loadCohortSectionTeacherNames } from "@/lib/academics/loadCohortSectionTeacherNames";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: async () => undefined,
}));

function client() {
  return {
    from(table: string) {
      const chain = {
        select: () => chain,
        in: () => chain,
        then: (
          resolve: (value: { data: unknown[]; error: null }) => unknown,
        ) => {
          if (table === "academic_section_assistants") {
            return resolve({
              data: [
                { section_id: "s1", assistant_id: "lead" },
                { section_id: "s1", assistant_id: "asst" },
              ],
              error: null,
            });
          }
          if (table === "academic_section_external_assistants") {
            return resolve({
              data: [{ section_id: "s1", display_name: "Mora Sol" }],
              error: null,
            });
          }
          return resolve({
            data: [
              { id: "lead", first_name: "Ana", last_name: "Vargas" },
              { id: "asst", first_name: "Luis", last_name: "Perez" },
            ],
            error: null,
          });
        },
      };
      return chain;
    },
  };
}

describe("loadCohortSectionTeacherNames", () => {
  it("returns the lead, the assistant, and the external name for the section", async () => {
    const names = await loadCohortSectionTeacherNames(client() as never, [
      { id: "s1", teacherId: "lead" },
    ]);
    expect(names.get("s1")).toEqual(["Vargas Ana", "Perez Luis", "Mora Sol"]);
  });
});
