/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mocks } = vi.hoisted(() => ({
  mocks: {
    catalogRows: [] as unknown[],
    catalogError: null as unknown,
    translationRows: [] as unknown[],
    translationsError: null as unknown,
    activeOnlyApplied: false,
  },
}));

function buildCatalogChain() {
  const order = vi.fn();
  const eq = vi.fn(() => {
    mocks.activeOnlyApplied = true;
    return Promise.resolve({ data: mocks.catalogRows, error: mocks.catalogError });
  });
  order
    .mockReturnValueOnce({
      order: vi.fn().mockReturnValue({
        eq,
        then: (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ data: mocks.catalogRows, error: mocks.catalogError }).then(resolve),
      }),
    })
    .mockReturnValueOnce({
      eq,
    });
  const select = vi.fn(() => ({ order }));
  return { select };
}

function buildTranslationsChain() {
  const inFn = vi.fn(() =>
    Promise.resolve({ data: mocks.translationRows, error: mocks.translationsError }),
  );
  const select = vi.fn(() => ({ in: inFn }));
  return { select };
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "badge_catalog") return buildCatalogChain();
      if (table === "badge_translations") return buildTranslationsChain();
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { loadActiveBadgeCatalog } from "@/lib/badges/loadBadgeCatalog";

beforeEach(() => {
  mocks.catalogRows = [];
  mocks.catalogError = null;
  mocks.translationRows = [];
  mocks.translationsError = null;
  mocks.activeOnlyApplied = false;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadActiveBadgeCatalog", () => {
  it("returns an empty list when the catalog query has no rows", async () => {
    const out = await loadActiveBadgeCatalog();
    expect(out).toEqual([]);
  });

  it("decodes rows and merges translations grouped by badge_id and locale", async () => {
    mocks.catalogRows = [
      {
        id: "b1",
        code: "tasks_completed_5",
        category: "tasks",
        criteria_type: "tasks_completed",
        criteria_threshold: 5,
        image_path: "b1/x.png",
        is_active: true,
        sort_order: 20,
      },
      {
        id: "b2",
        code: "profile_complete",
        category: "profile",
        criteria_type: "profile_complete",
        criteria_threshold: 1,
        image_path: null,
        is_active: true,
        sort_order: 50,
      },
    ];
    mocks.translationRows = [
      { badge_id: "b1", locale: "en", title: "Five tasks", description: "Complete 5 tasks." },
      { badge_id: "b1", locale: "es", title: "Cinco tareas", description: "Completá 5 tareas." },
      { badge_id: "b2", locale: "en", title: "Profile ready", description: "Complete profile." },
      { badge_id: "b2", locale: "fr", title: "Profil", description: "ignored" },
    ];
    const out = await loadActiveBadgeCatalog();
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      id: "b1",
      code: "tasks_completed_5",
      category: "tasks",
      criteriaType: "tasks_completed",
      criteriaThreshold: 5,
      imagePath: "b1/x.png",
      isActive: true,
      sortOrder: 20,
    });
    expect(out[0]!.translations.en?.title).toBe("Five tasks");
    expect(out[0]!.translations.es?.title).toBe("Cinco tareas");
    // unknown locale is dropped
    expect((out[1]!.translations as Record<string, unknown>).fr).toBeUndefined();
    expect(out[1]!.translations.en?.title).toBe("Profile ready");
  });

  it("drops rows with unknown enum values", async () => {
    mocks.catalogRows = [
      {
        id: "bad",
        code: "x",
        category: "tasks",
        criteria_type: "ghost_type",
        criteria_threshold: 1,
        image_path: null,
        is_active: true,
        sort_order: 10,
      },
      {
        id: "ok",
        code: "ok",
        category: "tasks",
        criteria_type: "tasks_completed",
        criteria_threshold: 1,
        image_path: null,
        is_active: true,
        sort_order: 10,
      },
    ];
    const out = await loadActiveBadgeCatalog();
    expect(out.map((e) => e.code)).toEqual(["ok"]);
  });

  it("returns [] when the catalog query errors", async () => {
    mocks.catalogError = { message: "boom" };
    const out = await loadActiveBadgeCatalog();
    expect(out).toEqual([]);
  });
});
