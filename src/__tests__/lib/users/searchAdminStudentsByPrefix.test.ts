import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { searchAdminStudentsByPrefix } from "@/lib/users/searchAdminStudentsByPrefix";

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

describe("searchAdminStudentsByPrefix", () => {
  it("loads bounded window when query empty", async () => {
    const rows = [{ id: "s1", first_name: "Ana", last_name: "Zed", role: "student" }];
    const sb = mockClient({ data: rows, error: null });
    const hits = await searchAdminStudentsByPrefix(sb, "  ");
    expect(hits).toEqual([{ id: "s1", label: "Zed Ana", role: "student" }]);
    const chain = (sb.from as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    expect(chain.eq).toHaveBeenCalledWith("role", "student");
    expect(chain.or).not.toHaveBeenCalled();
    expect(chain.limit).toHaveBeenCalledWith(30);
  });

  it("returns [] on error", async () => {
    const sb = mockClient({ data: null, error: { message: "x" } });
    await expect(searchAdminStudentsByPrefix(sb, "")).resolves.toEqual([]);
  });

  it("uses prefix branch when query non-empty", async () => {
    const sb = mockClient({
      data: [{ id: "s2", first_name: "Bea", last_name: "A", role: "student" }],
      error: null,
    });
    const hits = await searchAdminStudentsByPrefix(sb, "Be");
    expect(hits).toEqual([{ id: "s2", label: "A Bea", role: "student" }]);
    const chain = (sb.from as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    expect(chain.or).toHaveBeenCalled();
  });
});
