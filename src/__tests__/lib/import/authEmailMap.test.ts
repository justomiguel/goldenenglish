/** @vitest-environment node */
import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildEmailToUserIdMap, loadAuthEmailMap } from "@/lib/import/authEmailMap";

vi.mock("@/lib/supabase/listAllAuthUsers", () => ({
  listAllAuthUsers: vi.fn(),
}));

import { listAllAuthUsers } from "@/lib/supabase/listAllAuthUsers";

describe("buildEmailToUserIdMap", () => {
  it("normalizes email keys and skips missing emails", () => {
    const m = buildEmailToUserIdMap([
      { id: "a", email: "  X@Y.COM  " } as never,
      { id: "b", email: undefined } as never,
    ]);
    expect(m.get("x@y.com")).toBe("a");
    expect(m.has("b")).toBe(false);
  });
});

describe("loadAuthEmailMap", () => {
  it("returns map when list succeeds", async () => {
    vi.mocked(listAllAuthUsers).mockResolvedValueOnce({
      users: [{ id: "u1", email: "a@b.co" } as never],
      error: null,
    });
    const admin = {} as SupabaseClient;
    const m = await loadAuthEmailMap(admin);
    expect(m.get("a@b.co")).toBe("u1");
  });

  it("throws when list returns error", async () => {
    vi.mocked(listAllAuthUsers).mockResolvedValueOnce({
      users: [],
      error: new Error("list fail"),
    });
    await expect(loadAuthEmailMap({} as SupabaseClient)).rejects.toThrow("list fail");
  });
});
