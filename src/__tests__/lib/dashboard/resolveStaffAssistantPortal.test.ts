// REGRESSION CHECK: resolveStaffAssistantPortal gates the assistant dashboard layout; only profiles.role === "assistant" should pass.
import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveStaffAssistantPortal } from "@/lib/dashboard/resolveStaffAssistantPortal";

function mockSupabase(role: string | null | undefined) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: role == null ? null : { role } }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("resolveStaffAssistantPortal", () => {
  it("returns true for assistant role", async () => {
    const ok = await resolveStaffAssistantPortal(mockSupabase("assistant"), "u1");
    expect(ok).toBe(true);
  });

  it("returns false for teacher role", async () => {
    const ok = await resolveStaffAssistantPortal(mockSupabase("teacher"), "u1");
    expect(ok).toBe(false);
  });

  it("returns false when profile missing", async () => {
    const ok = await resolveStaffAssistantPortal(mockSupabase(null), "u1");
    expect(ok).toBe(false);
  });
});
