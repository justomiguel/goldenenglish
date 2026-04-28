// REGRESSION CHECK: Empty-query branch must stay bounded (limit) and role=parent only;
// prefix branch must keep ILIKE prefix + wildcard escape via buildIlikePrefixPattern.
import { describe, expect, it, vi } from "vitest";
import { searchAdminParentsByPrefix } from "@/lib/users/searchAdminParentsByPrefix";
import type { SupabaseClient } from "@supabase/supabase-js";

function profilesChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

function mockClient(result: { data: unknown; error: unknown }): SupabaseClient {
  return {
    from: vi.fn(() => profilesChain(result)),
  } as unknown as SupabaseClient;
}

describe("searchAdminParentsByPrefix", () => {
  it("loads a bounded alphabetical window when query is empty", async () => {
    const rows = [{ id: "p1", first_name: "Ana", last_name: "López", role: "parent" }];
    const sb = mockClient({ data: rows, error: null });
    const hits = await searchAdminParentsByPrefix(sb, "   ");
    expect(hits).toEqual([{ id: "p1", label: "López Ana" }]);
    const chain = (sb.from as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    expect(chain.eq).toHaveBeenCalledWith("role", "parent");
    expect(chain.or).not.toHaveBeenCalled();
    expect(chain.limit).toHaveBeenCalledWith(30);
  });

  it("returns [] on error", async () => {
    const sb = mockClient({ data: null, error: { message: "x" } });
    await expect(searchAdminParentsByPrefix(sb, "")).resolves.toEqual([]);
  });

  it("uses prefix filter when query is non-empty", async () => {
    const sb = mockClient({
      data: [{ id: "p2", first_name: "Bob", last_name: "Smith", role: "parent" }],
      error: null,
    });
    const hits = await searchAdminParentsByPrefix(sb, "Sm");
    expect(hits).toEqual([{ id: "p2", label: "Smith Bob" }]);
    const chain = (sb.from as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    expect(chain.or).toHaveBeenCalled();
  });
});
