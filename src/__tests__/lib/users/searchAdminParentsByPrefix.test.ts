// REGRESSION CHECK: Empty-query branch must stay bounded (limit) and role=parent only;
// prefix branch must keep ILIKE prefix + wildcard escape via buildIlikePrefixPattern;
// multi-word queries must still find guardians (token OR + personProfileMatchPrefix);
// full-email queries resolve via auth lookup without inventing a profiles.email column.
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAdminParentsPrefixOrFilter,
  searchAdminParentsByPrefix,
} from "@/lib/users/searchAdminParentsByPrefix";
import type { SupabaseClient } from "@supabase/supabase-js";

const findAuthByEmailMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/findAuthUserIdByNormalizedEmail", () => ({
  findAuthUserIdByNormalizedEmail: findAuthByEmailMock,
}));

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

describe("buildAdminParentsPrefixOrFilter", () => {
  it("includes per-token name prefixes for multi-word queries", () => {
    const filter = buildAdminParentsPrefixOrFilter("María García");
    expect(filter).toContain("first_name.ilike.María%");
    expect(filter).toContain("last_name.ilike.García%");
    expect(filter).toContain("first_name.ilike.María García%");
    expect(filter).toContain("dni_or_passport.ilike.María García%");
  });

  it("adds id.eq when emailMatchUserId is provided", () => {
    const filter = buildAdminParentsPrefixOrFilter("a@b.co", "user-1");
    expect(filter).toContain("id.eq.user-1");
  });
});

describe("searchAdminParentsByPrefix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findAuthByEmailMock.mockResolvedValue({ userId: null, error: null });
  });

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
      data: [
        {
          id: "p2",
          first_name: "Bob",
          last_name: "Smith",
          role: "parent",
          dni_or_passport: "X1",
        },
      ],
      error: null,
    });
    const hits = await searchAdminParentsByPrefix(sb, "Sm");
    expect(hits).toEqual([{ id: "p2", label: "Smith Bob" }]);
    const chain = (sb.from as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    expect(chain.or).toHaveBeenCalled();
  });

  it("keeps full-name matches and drops token-only false positives", async () => {
    const sb = mockClient({
      data: [
        {
          id: "keep",
          first_name: "María",
          last_name: "García",
          role: "parent",
          dni_or_passport: "1",
        },
        {
          id: "drop",
          first_name: "Ana",
          last_name: "García",
          role: "parent",
          dni_or_passport: "2",
        },
      ],
      error: null,
    });
    const hits = await searchAdminParentsByPrefix(sb, "María García");
    expect(hits).toEqual([{ id: "keep", label: "García María" }]);
    const chain = (sb.from as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    const orArg = String(chain.or.mock.calls[0]?.[0] ?? "");
    expect(orArg).toContain("first_name.ilike.María%");
    expect(orArg).toContain("last_name.ilike.García%");
  });

  it("resolves a full email to the matching parent profile", async () => {
    findAuthByEmailMock.mockResolvedValueOnce({ userId: "auth-parent", error: null });
    const sb = mockClient({
      data: [
        {
          id: "auth-parent",
          first_name: "Pat",
          last_name: "Mail",
          role: "parent",
          dni_or_passport: "99",
        },
      ],
      error: null,
    });
    const hits = await searchAdminParentsByPrefix(sb, "pat@example.com");
    expect(findAuthByEmailMock).toHaveBeenCalledWith(sb, "pat@example.com");
    expect(hits).toEqual([{ id: "auth-parent", label: "Mail Pat" }]);
    const chain = (sb.from as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    expect(String(chain.or.mock.calls[0]?.[0] ?? "")).toContain("id.eq.auth-parent");
  });
});
