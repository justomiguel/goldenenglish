/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_SITE_THEME_PAGE_SIZE,
  loadAdminSiteThemes,
} from "@/lib/cms/loadAdminSiteThemes";

interface FakeRow {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  is_system_default?: boolean;
  properties: unknown;
  content: unknown;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

function makeSupabase(rows: FakeRow[], total = rows.length, error: unknown = null) {
  const calls: Array<[string, unknown]> = [];
  const builder: Record<string, ReturnType<typeof vi.fn>> & {
    then?: (cb: (v: unknown) => unknown) => Promise<unknown>;
  } = {} as never;

  builder.select = vi.fn().mockImplementation((cols: string) => {
    calls.push(["select", cols]);
    return builder;
  });
  builder.order = vi.fn().mockImplementation((col: string, opts) => {
    calls.push(["order", { col, opts }]);
    return builder;
  });
  builder.range = vi.fn().mockImplementation((from: number, to: number) => {
    calls.push(["range", { from, to }]);
    return builder;
  });
  builder.is = vi.fn().mockImplementation((col: string, val: unknown) => {
    calls.push(["is", { col, val }]);
    return builder;
  });
  builder.then = (cb) =>
    Promise.resolve({ data: error ? null : rows, error, count: total }).then(cb);

  return {
    from: vi.fn().mockReturnValue(builder),
    calls,
  };
}

const sample: FakeRow = {
  id: "row-1",
  slug: "default",
  name: "Default",
  is_active: true,
  is_system_default: true,
  properties: { "color.primary": "#103A5C" },
  content: {},
  archived_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  updated_by: null,
};

describe("loadAdminSiteThemes", () => {
  it("maps DB rows into SiteThemeRow shape", async () => {
    const { from } = makeSupabase([sample]);
    const result = await loadAdminSiteThemes(
      { from } as never,
      { includeArchived: true },
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        id: "row-1",
        slug: "default",
        isActive: true,
        isSystemDefault: true,
        archivedAt: null,
      }),
    );
    expect(result.total).toBe(1);
    expect(result.truncated).toBe(false);
  });

  it("filters out archived rows when includeArchived=false", async () => {
    const { from, calls } = makeSupabase([sample]);
    await loadAdminSiteThemes(
      { from } as never,
      { includeArchived: false },
    );
    expect(calls).toContainEqual([
      "is",
      { col: "archived_at", val: null },
    ]);
  });

  it("orders active first then by archived_at and recency", async () => {
    const { from, calls } = makeSupabase([sample]);
    await loadAdminSiteThemes({ from } as never);
    const orderCalls = calls.filter(([kind]) => kind === "order");
    expect(orderCalls.length).toBeGreaterThanOrEqual(3);
  });

  it("uses the bounded page size in the range", async () => {
    const { from, calls } = makeSupabase([sample]);
    await loadAdminSiteThemes({ from } as never);
    expect(calls).toContainEqual([
      "range",
      { from: 0, to: ADMIN_SITE_THEME_PAGE_SIZE - 1 },
    ]);
  });

  it("flags truncated when total > rows.length", async () => {
    const { from } = makeSupabase([sample], 1000);
    const result = await loadAdminSiteThemes({ from } as never);
    expect(result.truncated).toBe(true);
    expect(result.total).toBe(1000);
  });

  it("returns empty result on Supabase error", async () => {
    const { from } = makeSupabase([], 0, { message: "boom" });
    const result = await loadAdminSiteThemes({ from } as never);
    expect(result.rows).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.truncated).toBe(false);
  });
});
