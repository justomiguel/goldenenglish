import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { searchTeacherStudentsInOwnSections } from "@/lib/academics/searchTeacherStudentsInOwnSections";

describe("searchTeacherStudentsInOwnSections", () => {
  it("returns [] without querying when query is too short", async () => {
    const from = vi.fn();
    const client = { from } as unknown as SupabaseClient;
    await expect(
      searchTeacherStudentsInOwnSections(client, "tid", "a", ["00000000-0000-4000-8000-000000000001"]),
    ).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("returns [] when sectionIds is empty", async () => {
    const from = vi.fn();
    const client = { from } as unknown as SupabaseClient;
    await expect(searchTeacherStudentsInOwnSections(client, "tid", "ab", [])).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });
});
