import { describe, expect, it } from "vitest";
import { isSkinSectionVisible, mergeSkinContent, pickLocalized, resolveSkin } from "@/lib/landing/skin/resolveSkin";
import type { ResolvedSkin } from "@/lib/landing/skin/skinModel";

function defaults(): ResolvedSkin {
  return {
    inicio: { label: "Inicio", scene: "s", title: "Default title", body: "b", cta: "c", heroCta: "h", imageAlt: "a" },
    ritmo: { lines: [{ text: "08:00. Llegada" }] },
    historia: { label: "Historia", body: "hb", manifesto: [] },
    oferta: { label: "Oferta", body: "ob", items: [{ id: "x", name: "Default item", line: "l", detail: "d" }] },
    metodo: { label: "Método", body: "mb", pillars: [] },
    horarios: { label: "Horarios", body: "", levels: [], slots: [] },
    equipo: { label: "Equipo", people: [] },
    comunidad: { label: "Comunidad", body: "cb", title: "ct", closingBody: "" },
    admision: { label: "Admisión", steps: [] },
    faq: { label: "Preguntas", entries: [{ q: "q", a: "a" }] },
    contacto: { label: "Contacto", laterTitle: "lt", laterBody: "lb" },
  };
}

// REGRESSION CHECK: owner value must win over the skin default; a saved empty list must stay empty.
describe("resolveSkin", () => {
  it("uses owner text and falls back to the default", () => {
    const skin = resolveSkin({
      defaults: defaults(),
      stored: { v: 1, sections: { inicio: { fields: { title: { es: "Mi club" } } } } },
      locale: "en",
    });
    expect(skin.inicio.title).toBe("Mi club");
    expect(skin.inicio.body).toBe("b");
  });

  it("replaces a default list with the owner list, even when empty", () => {
    const skin = resolveSkin({
      defaults: defaults(),
      stored: { v: 1, sections: { faq: { lists: { entries: [] } } } },
      locale: "es",
    });
    expect(skin.faq.entries).toEqual([]);
    expect(isSkinSectionVisible(skin, "faq")).toBe(false);
  });

  it("keeps default lists when the owner saved none", () => {
    const skin = resolveSkin({ defaults: defaults(), stored: { v: 1, sections: {} }, locale: "es" });
    expect(skin.oferta.items[0]?.name).toBe("Default item");
    expect(isSkinSectionVisible(skin, "equipo")).toBe(false);
    expect(isSkinSectionVisible(skin, "historia")).toBe(true);
  });

  it("lets stored values win over legacy values", () => {
    const merged = mergeSkinContent(
      { v: 1, sections: { inicio: { fields: { title: { es: "Legacy" }, body: { es: "Legacy body" } } } } },
      { v: 1, sections: { inicio: { fields: { title: { es: "Stored" } } } } },
    );
    expect(merged.sections.inicio?.fields).toEqual({ title: { es: "Stored" }, body: { es: "Legacy body" } });
  });

  it("resolves a list hole to the default item at the same index", () => {
    const base = defaults();
    base.ritmo.lines = [{ text: "A" }, { text: "b" }, { text: "C" }];
    const skin = resolveSkin({
      defaults: base,
      stored: { v: 1, sections: { ritmo: { lists: { lines: [{}, { text: { es: "B" } }] } } } },
      locale: "es",
    });
    expect(skin.ritmo.lines).toEqual([{ text: "A" }, { text: "B" }]);
  });

  it("drops a list hole that has no default item at its index", () => {
    const skin = resolveSkin({
      defaults: defaults(),
      stored: { v: 1, sections: { ritmo: { lists: { lines: [{ text: { es: "X" } }, {}, {}] } } } },
      locale: "es",
    });
    expect(skin.ritmo.lines).toEqual([{ text: "X" }]);
  });

  it("replaces the legacy list with the stored list on merge", () => {
    const merged = mergeSkinContent(
      { v: 1, sections: { faq: { lists: { entries: [{ q: { es: "old" } }, { q: { es: "old2" } }] } } } },
      { v: 1, sections: { faq: { lists: { entries: [{ q: { es: "new" } }] } } } },
    );
    expect(merged.sections.faq?.lists?.entries).toEqual([{ q: { es: "new" } }]);
  });
});

describe("pickLocalized", () => {
  it("falls back to es, then en, then pt", () => {
    expect(pickLocalized({ en: "E", pt: "P" }, "es")).toBe("E");
    expect(pickLocalized({ pt: "P" }, "es")).toBe("P");
    expect(pickLocalized({ es: "S", en: "E" }, "pt")).toBe("S");
    expect(pickLocalized({ es: " ", en: "E" }, "pt")).toBe("E");
    expect(pickLocalized(undefined, "es")).toBe("");
  });
});
