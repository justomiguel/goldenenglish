import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";

/** Minimal chain: profiles.maybeSingle + two section queries (loadTeacherSectionIdsForUser). */
function mockSupabaseForPortal(opts: {
  role: string | null;
  leadSectionRows: { id: string }[];
  assistantRows: { section_id: string }[];
  isAdminRpc?: boolean;
}) {
  const { role, leadSectionRows, assistantRows, isAdminRpc } = opts;
  return {
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: role == null ? null : { role },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "academic_sections") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: leadSectionRows, error: null }),
            }),
          }),
        };
      }
      if (table === "academic_section_assistants") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: assistantRows, error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
    rpc: vi.fn((name: string) => {
      if (name === "is_current_user_admin") {
        return Promise.resolve({ data: isAdminRpc ?? false, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
  } as unknown as SupabaseClient;
}

describe("resolveTeacherPortalAccess", () => {
  it("allows admin profile with no sections when is_current_user_admin is true", async () => {
    const supabase = mockSupabaseForPortal({
      role: "admin",
      leadSectionRows: [],
      assistantRows: [],
      isAdminRpc: true,
    });
    await expect(resolveTeacherPortalAccess(supabase, "u1")).resolves.toEqual({
      allowed: true,
      profileRole: "admin",
    });
  });

  it("allows coordinator profile with a lead section row", async () => {
    const supabase = mockSupabaseForPortal({
      role: "admin",
      leadSectionRows: [{ id: "sec-1" }],
      assistantRows: [],
      isAdminRpc: false,
    });
    await expect(resolveTeacherPortalAccess(supabase, "u1")).resolves.toEqual({
      allowed: true,
      profileRole: "admin",
    });
  });

  it("denies parent with no sections and not admin", async () => {
    const supabase = mockSupabaseForPortal({
      role: "parent",
      leadSectionRows: [],
      assistantRows: [],
      isAdminRpc: false,
    });
    await expect(resolveTeacherPortalAccess(supabase, "u1")).resolves.toEqual({
      allowed: false,
      profileRole: "parent",
    });
  });
});
