import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminSectionTeachersAndAssistants } from "@/lib/academics/loadAdminSectionTeachersAndAssistants";

type ProfileRow = { id: string; first_name: string; last_name: string };

function mockSupabase(input: {
  teacherCandidates: ProfileRow[];
  assistantCandidates?: ProfileRow[];
  sectionAssistantIds?: string[];
}) {
  const teacherCandidates = input.teacherCandidates;
  const assistantCandidates = input.assistantCandidates ?? [];
  const sectionAssistantIds = input.sectionAssistantIds ?? [];

  const profilesByRoleListCalls: { args: unknown[] }[] = [];

  return {
    spy: profilesByRoleListCalls,
    client: {
      from: (table: string) => {
        if (table === "profiles") {
          return {
            select: () => ({
              in: (column: string, values: string[]) => {
                profilesByRoleListCalls.push({ args: [column, values] });
                if (column === "role") {
                  // Pick-list query: role IN [...lead-eligible].
                  if (values.includes("teacher") && values.includes("admin")) {
                    return {
                      order: () => ({
                        limit: () => Promise.resolve({ data: teacherCandidates, error: null }),
                      }),
                    };
                  }
                }
                if (column === "id") {
                  // Initial assistants resolution from ids.
                  return Promise.resolve({
                    data: [...teacherCandidates, ...assistantCandidates]
                      .filter((p) => values.includes(p.id))
                      .map((p) => ({ ...p, role: "teacher" })),
                    error: null,
                  });
                }
                return { order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) };
              },
              eq: (column: string, value: string) => {
                if (column === "role" && value === "assistant") {
                  return {
                    order: () => ({
                      limit: () => Promise.resolve({ data: assistantCandidates, error: null }),
                    }),
                  };
                }
                return { maybeSingle: () => Promise.resolve({ data: null, error: null }) };
              },
            }),
          };
        }
        if (table === "academic_section_assistants") {
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({
                  data: sectionAssistantIds.map((assistant_id) => ({ assistant_id })),
                  error: null,
                }),
            }),
          };
        }
        if (table === "academic_section_external_assistants") {
          return {
            select: () => ({
              eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseClient,
  };
}

describe("loadAdminSectionTeachersAndAssistants — admin in teacher pick-list", () => {
  it("queries profiles with role IN [teacher, admin] and includes admins as candidates", async () => {
    const { client, spy } = mockSupabase({
      teacherCandidates: [
        { id: "t1", first_name: "Tina", last_name: "Teacher" },
        { id: "a1", first_name: "Alice", last_name: "Admin" },
      ],
    });

    const out = await loadAdminSectionTeachersAndAssistants(client, "sec-1", "t1");

    const roleCall = spy.find((c) => c.args[0] === "role");
    expect(roleCall).toBeDefined();
    expect((roleCall!.args[1] as string[]).sort()).toEqual(["admin", "teacher"]);
    expect(out.teachers.map((t) => t.id).sort()).toEqual(["a1", "t1"]);
    expect(out.assistantPortalStaffOptions.map((o) => o.id).sort()).toContain("a1");
  });
});
