import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";

// REGRESSION CHECK: Admin layouts use profile role + RPC fallback consistently.
describe("resolveIsAdminSession", () => {
  it("returns true when profile role is admin", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: { role: "admin" }, error: null }),
          }),
        }),
      }),
      rpc: vi.fn(),
    } as unknown as SupabaseClient;

    await expect(resolveIsAdminSession(supabase, "u1")).resolves.toBe(true);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("calls RPC when profile is not admin and RPC returns true", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: { role: "student" }, error: null }),
          }),
        }),
      }),
      rpc: vi.fn(() => Promise.resolve({ data: true, error: null })),
    } as unknown as SupabaseClient;

    await expect(resolveIsAdminSession(supabase, "u1")).resolves.toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith("is_current_user_admin");
  });

  it("returns false when profile missing and RPC errors", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      rpc: vi.fn(() =>
        Promise.resolve({ data: null, error: { message: "nope" } }),
      ),
    } as unknown as SupabaseClient;

    await expect(resolveIsAdminSession(supabase, "u1")).resolves.toBe(false);
  });
});
