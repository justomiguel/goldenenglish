import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";
import { carryGenericLandingContent } from "@/lib/landing/carryGenericLandingContent";
import type { Dictionary } from "@/types/i18n";
import type { SiteThemeContent } from "@/types/theming";

const defaults = {
  es: es as Dictionary,
  en: en as Dictionary,
  pt: pt as Dictionary,
};

describe("carryGenericLandingContent", () => {
  it("copies the text the visitor already sees onto the next template", () => {
    const content: SiteThemeContent = {
      inicio: {
        "genericLandings.deportes.title": { es: "Título editado" },
      },
    };
    const next = carryGenericLandingContent(content, "deportes", "jardin", defaults);
    expect(next.inicio?.["genericLandings.jardin.title"]?.es).toBe("Título editado");
    expect(next.historia?.["genericLandings.jardin.sections.historia"]?.es).toBe(
      es.landing.genericLandings.deportes.sections.historia,
    );
    expect(next.inicio?.["genericLandings.jardin.body"]?.es).toBe(
      es.landing.genericLandings.deportes.body,
    );
    expect(next.inicio?.["genericLandings.deportes.title"]?.es).toBe("Título editado");
  });

  it("leaves the content map alone when the kind does not change", () => {
    const content: SiteThemeContent = {
      inicio: { "genericLandings.deportes.title": { es: "Igual" } },
    };
    expect(carryGenericLandingContent(content, "deportes", "deportes", defaults)).toEqual(content);
  });
});
