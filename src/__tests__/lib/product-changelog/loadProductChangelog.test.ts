import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, logServerError, logSupabaseError, isConfigured } = vi.hoisted(() => ({
  from: vi.fn(),
  logServerError: vi.fn(),
  logSupabaseError: vi.fn(),
  isConfigured: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerError: (...args: unknown[]) => logServerError(...args),
  logSupabaseError: (...args: unknown[]) => logSupabaseError(...args),
}));
vi.mock("@/lib/supabase/pulsar", () => ({
  isPulsarSupabaseConfigured: () => isConfigured(),
  createPulsarAdminClient: () => ({ from }),
}));

import {
  CHANGELOG_UNAVAILABLE,
  loadProductChangelogEntries,
} from "@/lib/product-changelog/loadProductChangelog";

function queryResult(result: { data: unknown; error: unknown }) {
  const range = vi.fn().mockResolvedValue(result);
  const orderPosition = vi.fn().mockReturnValue({ range });
  const orderDate = vi.fn().mockReturnValue({ order: orderPosition });
  const select = vi.fn().mockReturnValue({ order: orderDate });
  from.mockReturnValue({ select });
}

describe("loadProductChangelogEntries", () => {
  beforeEach(() => {
    from.mockReset();
    logServerError.mockReset();
    logSupabaseError.mockReset();
    isConfigured.mockReset();
  });

  it("returns changelog_unavailable when Pulsar is not configured", async () => {
    isConfigured.mockReturnValue(false);
    const result = await loadProductChangelogEntries();
    expect(result).toEqual({ ok: false, code: CHANGELOG_UNAVAILABLE, entries: [] });
    expect(logServerError).toHaveBeenCalledWith(
      "loadProductChangelogEntries",
      expect.objectContaining({ code: CHANGELOG_UNAVAILABLE }),
    );
    expect(from).not.toHaveBeenCalled();
  });

  it("returns changelog_unavailable when the query fails", async () => {
    isConfigured.mockReturnValue(true);
    queryResult({ data: null, error: { message: "down", code: "XX000" } });
    const result = await loadProductChangelogEntries();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(CHANGELOG_UNAVAILABLE);
    expect(logSupabaseError).toHaveBeenCalledWith(
      "loadProductChangelogEntries",
      expect.objectContaining({ code: "XX000" }),
      expect.objectContaining({ code: CHANGELOG_UNAVAILABLE }),
    );
  });

  it("maps a row and drops an unknown area", async () => {
    isConfigured.mockReturnValue(true);
    queryResult({
      error: null,
      data: [
        {
          id: "trial-classes",
          published_on: "2026-08-01",
          area: "academic",
          title_es: "Clases de prueba",
          title_en: "Trial classes",
          title_pt: "Aulas experimentais",
          summary_es: "La familia puede pedir una clase de prueba desde la web.",
          summary_en: "A family can request a trial class from the site.",
          summary_pt: "A família pode pedir uma aula experimental no site.",
          position: 0,
        },
        {
          id: "bad-area",
          published_on: "2026-08-02",
          area: "unknown",
          title_es: "x",
          title_en: "x",
          title_pt: "x",
          summary_es: "x",
          summary_en: "x",
          summary_pt: "x",
          position: 1,
        },
      ],
    });
    const result = await loadProductChangelogEntries();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entries).toEqual([
        {
          id: "trial-classes",
          date: "2026-08-01",
          area: "academic",
          title: { es: "Clases de prueba", en: "Trial classes", pt: "Aulas experimentais" },
          summary: {
            es: "La familia puede pedir una clase de prueba desde la web.",
            en: "A family can request a trial class from the site.",
            pt: "A família pode pedir uma aula experimental no site.",
          },
        },
      ]);
    }
  });
});
