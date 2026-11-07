import { describe, expect, it } from "vitest";
import { legacyGenericContentToSkin } from "@/lib/landing/skin/legacyGenericContentToSkin";

// REGRESSION CHECK: this mapper is the only path for pre-skin owner text. Do not drop a row of the mapping table.
// Rhythm lines keep their position; a missing earlier line is an empty hole that resolveSkin fills from the skin default.
describe("legacyGenericContentToSkin", () => {
  it("maps hero text from any kind prefix", () => {
    const skin = legacyGenericContentToSkin({
      inicio: {
        "genericLandings.jardin.title": { es: "Un jardín", en: "A garden" },
        "genericLandings.jardin.rhythmB": { es: "10:00. Juego" },
      },
    });
    expect(skin.sections.inicio?.fields?.title).toEqual({ es: "Un jardín", en: "A garden" });
    expect(skin.sections.ritmo?.lists?.lines).toEqual([{}, { text: { es: "10:00. Juego" } }]);
  });

  it("maps section bodies and labels to the canonical section", () => {
    const skin = legacyGenericContentToSkin({
      modalidades: {
        "genericSectionLabels.modalidades": { es: "Método" },
        "genericLandings.deportes.sections.modalidades": { es: "Entrenamos así." },
      },
    });
    expect(skin.sections.metodo?.fields).toEqual({ label: { es: "Método" }, body: { es: "Entrenamos así." } });
  });

  it("ignores keys outside the mapping", () => {
    expect(legacyGenericContentToSkin({ inicio: { "hero.kicker": { es: "x" } } })).toEqual({ v: 1, sections: {} });
  });

  it("returns an empty model for no content", () => {
    expect(legacyGenericContentToSkin(null)).toEqual({ v: 1, sections: {} });
  });

  it("ignores prototype keys such as constructor", () => {
    const skin = legacyGenericContentToSkin({
      inicio: {
        "genericSectionLabels.constructor": { es: "x" },
        "genericLandings.deportes.constructor": { es: "x" },
        "genericLandings.deportes.toString": { es: "x" },
      },
    });
    expect(skin).toEqual({ v: 1, sections: {} });
  });
});
