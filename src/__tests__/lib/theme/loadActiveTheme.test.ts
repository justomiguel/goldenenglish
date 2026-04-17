import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// REGRESSION CHECK: loadActiveTheme is invoked from the root layout on every
// request (via loadEffectiveProperties). It MUST never throw or the whole app
// stops rendering. Cover: env missing, no active row, db error, valid row.

const supabaseCreate = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => supabaseCreate(...args),
}));

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...a: unknown[]) => unknown>(fn: T) => fn,
}));

const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

interface MaybeSingleResult {
  data: unknown;
  error: { message?: string; code?: string } | null;
}

interface SelectResult {
  data: unknown;
  error: { message?: string; code?: string } | null;
}

function buildClient({
  themeRow,
  themeError,
  mediaRows,
  mediaError,
}: {
  themeRow: unknown;
  themeError?: MaybeSingleResult["error"];
  mediaRows?: unknown[];
  mediaError?: SelectResult["error"];
}) {
  const themeMaybeSingle = vi.fn(
    async (): Promise<MaybeSingleResult> => ({
      data: themeRow,
      error: themeError ?? null,
    }),
  );
  const themeIs = vi.fn(() => ({ maybeSingle: themeMaybeSingle }));
  const themeEq = vi.fn(() => ({ is: themeIs }));
  const themeSelect = vi.fn(() => ({ eq: themeEq }));

  const mediaOrder2 = vi.fn(
    async (): Promise<SelectResult> => ({
      data: mediaRows ?? [],
      error: mediaError ?? null,
    }),
  );
  const mediaOrder1 = vi.fn(() => ({ order: mediaOrder2 }));
  const mediaEq = vi.fn(() => ({ order: mediaOrder1 }));
  const mediaSelect = vi.fn(() => ({ eq: mediaEq }));

  return {
    from: vi.fn((table: string) => {
      if (table === "site_themes") return { select: themeSelect };
      if (table === "site_theme_media") return { select: mediaSelect };
      throw new Error(`unexpected table ${table}`);
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  errorSpy.mockClear();
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

describe("loadActiveTheme", () => {
  it("returns null when supabase env is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { loadActiveTheme } = await import("@/lib/theme/loadActiveTheme");
    expect(await loadActiveTheme()).toBeNull();
    expect(supabaseCreate).not.toHaveBeenCalled();
  });

  it("returns null when no active row exists", async () => {
    supabaseCreate.mockReturnValueOnce(buildClient({ themeRow: null }));
    const { loadActiveTheme } = await import("@/lib/theme/loadActiveTheme");
    expect(await loadActiveTheme()).toBeNull();
  });

  it("logs and returns null when the theme query errors", async () => {
    supabaseCreate.mockReturnValueOnce(
      buildClient({ themeRow: null, themeError: { message: "boom", code: "X" } }),
    );
    const { loadActiveTheme } = await import("@/lib/theme/loadActiveTheme");
    expect(await loadActiveTheme()).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns the theme with empty media when media query errors", async () => {
    supabaseCreate.mockReturnValueOnce(
      buildClient({
        themeRow: {
          id: "theme-1",
          slug: "default",
          name: "Default",
          is_active: true,
          properties: { "color.primary": "#000" },
          content: {},
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-02T00:00:00Z",
          updated_by: null,
        },
        mediaError: { message: "media boom", code: "Y" },
      }),
    );
    const { loadActiveTheme } = await import("@/lib/theme/loadActiveTheme");
    const snap = await loadActiveTheme();
    expect(snap).not.toBeNull();
    expect(snap?.theme.slug).toBe("default");
    expect(snap?.theme.properties).toEqual({ "color.primary": "#000" });
    expect(snap?.media).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("maps a fully populated row + media into the snapshot", async () => {
    supabaseCreate.mockReturnValueOnce(
      buildClient({
        themeRow: {
          id: "theme-2",
          slug: "navidad",
          name: "Navidad",
          is_active: true,
          properties: { "color.primary": "#A31A22", "bogus.key": 42 },
          content: { hero: { kicker: { es: "Felices fiestas" } } },
          created_at: "2026-12-01T00:00:00Z",
          updated_at: "2026-12-10T00:00:00Z",
          updated_by: "user-1",
        },
        mediaRows: [
          {
            id: "m-1",
            theme_id: "theme-2",
            section: "inicio",
            position: 1,
            storage_path: "navidad/hero1.png",
            alt_es: "Hero ES",
            alt_en: null,
          },
          {
            id: "m-2",
            theme_id: "theme-2",
            section: "unknown-section",
            position: 1,
            storage_path: "navidad/x.png",
            alt_es: null,
            alt_en: null,
          },
        ],
      }),
    );
    const { loadActiveTheme } = await import("@/lib/theme/loadActiveTheme");
    const snap = await loadActiveTheme();
    expect(snap?.theme.slug).toBe("navidad");
    /** non-string JSONB entries are dropped (only strings survive parse). */
    expect(snap?.theme.properties).toEqual({ "color.primary": "#A31A22" });
    expect(snap?.theme.content).toEqual({
      hero: { kicker: { es: "Felices fiestas" } },
    });
    /** Section outside LANDING_SECTION_SLUGS is filtered out. */
    expect(snap?.media).toHaveLength(1);
    expect(snap?.media[0]).toMatchObject({
      id: "m-1",
      section: "inicio",
      storagePath: "navidad/hero1.png",
      altEs: "Hero ES",
      altEn: null,
    });
  });
});
