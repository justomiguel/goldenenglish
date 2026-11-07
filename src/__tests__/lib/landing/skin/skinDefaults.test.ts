import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";
import { skinDefaults } from "@/lib/landing/skin/skinDefaults";
import { SKIN_LISTS, SKIN_SECTION_IDS } from "@/lib/landing/skin/skinModel";
import { GENERIC_INSTITUTE_KINDS } from "@/lib/theme/genericInstituteTemplates";
import type { Dictionary } from "@/types/i18n";

// REGRESSION CHECK: every skin must ship every section so a skin change never shows an empty page.
describe("skinDefaults", () => {
  for (const [name, dict] of [["es", es], ["en", en], ["pt", pt]] as const) {
    it.each(GENERIC_INSTITUTE_KINDS)(`${name}: %s has every section and lists within limits`, (kind) => {
      const skin = skinDefaults(dict as unknown as Dictionary, kind);
      for (const id of SKIN_SECTION_IDS) expect(skin[id]).toBeDefined();
      expect(skin.inicio.title.length).toBeGreaterThan(0);
      for (const [section, lists] of Object.entries(SKIN_LISTS)) {
        for (const [list, spec] of Object.entries(lists ?? {})) {
          const items = (skin as unknown as Record<string, Record<string, unknown[]>>)[section][list];
          expect(items.length).toBeLessThanOrEqual(spec.max);
        }
      }
      expect(skin.oferta.items.length).toBeGreaterThan(0);
      expect(skin.equipo.people.length).toBeGreaterThan(0);
      expect(skin.faq.entries.length).toBeGreaterThan(0);
    });
  }

  it("keeps slot references valid", () => {
    for (const kind of GENERIC_INSTITUTE_KINDS) {
      const skin = skinDefaults(es as unknown as Dictionary, kind);
      const items = new Set(skin.oferta.items.map((i) => i.id));
      const levels = new Set(skin.horarios.levels.map((l) => l.id));
      for (const slot of skin.horarios.slots) {
        expect(items.has(slot.itemId)).toBe(true);
        expect(levels.has(slot.levelId)).toBe(true);
      }
    }
  });
});
