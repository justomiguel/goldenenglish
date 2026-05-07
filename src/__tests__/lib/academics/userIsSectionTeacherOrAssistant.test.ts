// REGRESSION CHECK: userIsSectionTeacherOrAssistant must allow global assistant on non-archived sections without academic_section_assistants row.
import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";

describe("userIsSectionTeacherOrAssistant", () => {
  it("returns true for lead teacher", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "academic_sections") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { teacher_id: "u1", archived_at: null },
                  }),
              }),
            }),
          };
        }
        if (table === "academic_section_assistants") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: null }),
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    await expect(userIsSectionTeacherOrAssistant(supabase, "u1", "sec")).resolves.toBe(true);
  });

  it("returns true for global assistant on non-archived section", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "academic_sections") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { teacher_id: "other", archived_at: null },
                  }),
              }),
            }),
          };
        }
        if (table === "academic_section_assistants") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: null }),
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { role: "assistant" } }),
              }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    await expect(userIsSectionTeacherOrAssistant(supabase, "u1", "sec")).resolves.toBe(true);
  });

  it("returns false for non-staff when not lead nor assistant row", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "academic_sections") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { teacher_id: "other", archived_at: null },
                  }),
              }),
            }),
          };
        }
        if (table === "academic_section_assistants") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: null }),
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { role: "student" } }),
              }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    await expect(userIsSectionTeacherOrAssistant(supabase, "u1", "sec")).resolves.toBe(false);
  });

  it("returns false for global assistant on archived section", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "academic_sections") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { teacher_id: "other", archived_at: "2020-01-01" },
                  }),
              }),
            }),
          };
        }
        if (table === "academic_section_assistants") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: null }),
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    await expect(userIsSectionTeacherOrAssistant(supabase, "u1", "sec")).resolves.toBe(false);
  });
});
