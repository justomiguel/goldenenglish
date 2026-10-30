import { describe, expect, it } from "vitest";
import { isGenericLandingCopyKey } from "@/lib/cms/genericLandingCopyKeys";
import { isEditableLandingCopyKey } from "@/lib/cms/landingContentCatalog";
import { hiddenLandingSections } from "@/lib/theme/hiddenLandingSections";
import { seoTextForLocale } from "@/lib/theme/seoTextForLocale";

describe("generic site text", () => {
  it("accepts generic landing copy and rejects an unknown path", () => {
    expect(isGenericLandingCopyKey("genericLandings.deportes.title")).toBe(true);
    expect(isEditableLandingCopyKey("genericSectionLabels.historia")).toBe(true);
    expect(isGenericLandingCopyKey("genericLandings.deportes.secret")).toBe(false);
  });

  it("hides only the extra sections named in the override", () => {
    const hidden = hiddenLandingSections({ "app.landing.hidden": "historia, inicio, oferta" });
    expect(hidden.has("historia")).toBe(true);
    expect(hidden.has("oferta")).toBe(true);
    expect(hidden.has("inicio")).toBe(false);
  });

  it("uses the locale SEO text and falls back to Spanish", () => {
    const properties = {
      "app.seo.title": "Club",
      "app.seo.title.en": "Club EN",
      "app.seo.description": "",
    };
    expect(seoTextForLocale(properties, "en", "title")).toBe("Club EN");
    expect(seoTextForLocale(properties, "pt", "title")).toBe("Club");
    expect(seoTextForLocale(properties, "es", "description")).toBe("");
  });
});
