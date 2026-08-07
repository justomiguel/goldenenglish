// REGRESSION CHECK: Catalog ids ↔ dictionary keys (en/es/pt) ↔ runtime matrix.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listParentTutorialIds } from "@/lib/parent-tutorials/catalog";
import { listParentScreenTourIds, listParentScreenTourMetaKeys } from "@/lib/parent-tutorials/screenCatalog";
import { listParentTourRuntimeChecks } from "@/lib/parent-tutorials/listTourRuntimeChecks";

const DICT_DIR = join(process.cwd(), "src/dictionaries");

function loadDict(locale: "en" | "es" | "pt"): Record<string, unknown> {
  return JSON.parse(readFileSync(join(DICT_DIR, `${locale}.json`), "utf8")) as Record<
    string,
    unknown
  >;
}

function dashboard(dict: Record<string, unknown>): Record<string, unknown> {
  return dict.dashboard as Record<string, unknown>;
}

describe("parent tour catalog contract", () => {
  it("every catalog id has parentHelpCatalog + parentHelpTours in en/es/pt", () => {
    const ids = listParentTutorialIds();
    for (const locale of ["en", "es", "pt"] as const) {
      const dash = dashboard(loadDict(locale));
      const catalog = dash.parentHelpCatalog as Record<string, { title?: string }>;
      const tours = dash.parentHelpTours as Record<
        string,
        { steps?: Record<string, { title?: string; description?: string }> }
      >;
      for (const id of ids) {
        expect(catalog[id]?.title, `${locale} catalog ${id}`).toBeTruthy();
        expect(tours[id]?.steps?.intro?.title, `${locale} tour intro ${id}`).toBeTruthy();
        expect(
          tours[id]?.steps?.intro?.description,
          `${locale} tour intro desc ${id}`,
        ).toBeTruthy();
      }
    }
  });

  it("every screen meta key has parentHelpScreenTours entry in en/es/pt", () => {
    const keys = listParentScreenTourMetaKeys();
    for (const locale of ["en", "es", "pt"] as const) {
      const tours = dashboard(loadDict(locale)).parentHelpScreenTours as Record<
        string,
        { steps?: { intro?: unknown } }
      >;
      for (const key of keys) {
        expect(tours[key]?.steps?.intro, `${locale} screen ${key}`).toBeTruthy();
      }
    }
  });

  it("runtime matrix covers every catalog task and screen tour id", () => {
    const matrix = listParentTourRuntimeChecks();
    const taskRows = new Set(
      matrix.filter((r) => r.id.startsWith("task:")).map((r) => r.id.replace(/^task:/, "")),
    );
    const screenRows = new Set(
      matrix.filter((r) => r.id.startsWith("screen:")).map((r) => r.id.replace(/^screen:/, "")),
    );
    for (const id of listParentTutorialIds()) {
      expect(taskRows.has(id), `matrix task ${id}`).toBe(true);
    }
    for (const id of listParentScreenTourIds()) {
      expect(screenRows.has(id), `matrix screen ${id}`).toBe(true);
    }
  });
});
