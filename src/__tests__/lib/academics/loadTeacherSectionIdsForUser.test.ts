// REGRESSION CHECK: loadTeacherSectionIdsForUser must list institute-wide sections for profiles.role assistant (bounded), unchanged chain for teachers.
import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadTeacherSectionIdsForUser } from "@/lib/academics/loadTeacherSectionIdsForUser";

describe("loadTeacherSectionIdsForUser", () => {
  it("returns non-archived section ids for staff assistant role", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { role: "assistant" } }),
              }),
            }),
          };
        }
        if (table === "academic_sections") {
          return {
            select: () => ({
              is: () => ({
                order: () => ({
                  limit: () =>
                    Promise.resolve({
                      data: [{ id: "s1" }, { id: "s2" }],
                      error: null,
                    }),
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    await expect(loadTeacherSectionIdsForUser(supabase, "u1")).resolves.toEqual(["s1", "s2"]);
  });

  it("returns empty when institute-wide section list errors for assistant", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { role: "assistant" } }),
              }),
            }),
          };
        }
        if (table === "academic_sections") {
          return {
            select: () => ({
              is: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: null, error: { message: "db" } }),
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    await expect(loadTeacherSectionIdsForUser(supabase, "u1")).resolves.toEqual([]);
  });

  it("merges lead and per-section assistant rows for other roles", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { role: "teacher" } }),
              }),
            }),
          };
        }
        if (table === "academic_sections") {
          return {
            select: () => ({
              eq: () => ({
                limit: () => Promise.resolve({ data: [{ id: "lead-1" }], error: null }),
              }),
            }),
          };
        }
        if (table === "academic_section_assistants") {
          return {
            select: () => ({
              eq: () => ({
                limit: () => Promise.resolve({ data: [{ section_id: "as-1" }], error: null }),
              }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    const ids = await loadTeacherSectionIdsForUser(supabase, "u1");
    expect(ids.sort()).toEqual(["as-1", "lead-1"]);
  });
});
