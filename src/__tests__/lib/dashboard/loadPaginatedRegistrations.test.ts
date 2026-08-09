import { describe, expect, it, vi } from "vitest";
import { loadPaginatedRegistrations } from "@/lib/dashboard/loadPaginatedRegistrations";

/**
 * The loader awaits the count builder directly (no `.range()`), so the chain
 * stub has to be thenable the way a PostgREST builder is.
 */
function makeSupabase() {
  const calls = {
    select: [] as unknown[][],
    eq: [] as unknown[][],
    or: [] as unknown[][],
  };

  const chain: Record<string, unknown> = {
    select: vi.fn((...args: unknown[]) => {
      calls.select.push(args);
      return chain;
    }),
    neq: vi.fn(() => chain),
    or: vi.fn((...args: unknown[]) => {
      calls.or.push(args);
      return chain;
    }),
    eq: vi.fn((...args: unknown[]) => {
      calls.eq.push(args);
      return chain;
    }),
    order: vi.fn(() => chain),
    range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
    then: (resolve: (v: unknown) => unknown) =>
      resolve({ data: [], error: null, count: 0 }),
  };

  return {
    supabase: { from: vi.fn(() => chain) } as never,
    calls,
  };
}

describe("loadPaginatedRegistrations", () => {
  it("selects the follow-up and preferred section columns", async () => {
    const { supabase, calls } = makeSupabase();

    await loadPaginatedRegistrations(supabase, {});

    const selected = String(calls.select[0]?.[0] ?? "");
    expect(selected).toContain("preferred_section_id");
    expect(selected).toContain("contacted_at");
    expect(selected).toContain("contacted_by");
  });

  it("filters by follow-up status when one is requested", async () => {
    const { supabase, calls } = makeSupabase();

    await loadPaginatedRegistrations(supabase, { status: "contacted" });

    expect(calls.eq).toContainEqual(["status", "contacted"]);
  });

  it("applies the status filter to the count query too, so paging stays honest", async () => {
    const { supabase, calls } = makeSupabase();

    await loadPaginatedRegistrations(supabase, { status: "new" });

    const statusFilters = calls.eq.filter((c) => c[0] === "status");
    expect(statusFilters).toHaveLength(2);
  });

  it("does not filter by status when none is requested", async () => {
    const { supabase, calls } = makeSupabase();

    await loadPaginatedRegistrations(supabase, {});

    expect(calls.eq.filter((c) => c[0] === "status")).toHaveLength(0);
  });

  it("escapes wildcards in the search so a literal percent is not a wildcard", async () => {
    const { supabase, calls } = makeSupabase();

    await loadPaginatedRegistrations(supabase, { q: "50%" });

    expect(String(calls.or[0]?.[0] ?? "")).toContain("50\\%");
  });
});
