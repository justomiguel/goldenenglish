import { describe, expect, it } from "vitest";
import enDict from "@/dictionaries/en.json";
import esDict from "@/dictionaries/es.json";
import ptDict from "@/dictionaries/pt.json";
import { cleanLandingContentForPersistence } from "@/lib/cms/cleanLandingContentForPersistence";
import type { Dictionary } from "@/types/i18n";

const dicts = {
  en: enDict as Dictionary,
  es: esDict as Dictionary,
  pt: ptDict as Dictionary,
};

describe("cleanLandingContentForPersistence", () => {
  it("returns {} for non-object input", () => {
    expect(cleanLandingContentForPersistence(dicts, null)).toEqual({});
    expect(cleanLandingContentForPersistence(dicts, "noise")).toEqual({});
  });

  it("filters out unknown sections and unknown keys", () => {
    const result = cleanLandingContentForPersistence(dicts, {
      historia: {
        "story.title": { es: "Custom ES" },
        "story.unknown": { es: "Should drop" },
      },
      bogus: { foo: { es: "x" } },
    });
    expect(result).toEqual({
      historia: { "story.title": { es: "Custom ES" } },
    });
  });

  it("trims values, drops empty and locale-default matches", () => {
    const result = cleanLandingContentForPersistence(dicts, {
      historia: {
        "story.title": {
          es: "  Nuestra historia  ",
          en: "  Brand new EN  ",
        },
        "story.body1": { es: "" },
      },
    });
    expect(result).toEqual({
      historia: { "story.title": { en: "Brand new EN" } },
    });
  });

  it("sorts section keys alphabetically inside the output", () => {
    const result = cleanLandingContentForPersistence(dicts, {
      modalidades: {
        "modalities.intro": { en: "z value" },
        "modalities.title": { en: "a value" },
      },
    });
    const keys = Object.keys(result.modalidades ?? {});
    expect(keys).toEqual(["modalities.intro", "modalities.title"]);
  });

  it("ignores unknown locale keys", () => {
    const result = cleanLandingContentForPersistence(dicts, {
      historia: {
        "story.title": { fr: "français", en: "Brand-new" },
      },
    });
    expect(result).toEqual({
      historia: { "story.title": { en: "Brand-new" } },
    });
  });

  it("filters keys using mozarthitos catalog when template is mozarthitos", () => {
    const result = cleanLandingContentForPersistence(
      dicts,
      {
        historia: {
          "story.title": { es: "Should drop" },
          "mz.quienes.title": { es: "  Título custom  " },
        },
      },
      "mozarthitos",
    );
    expect(result).toEqual({
      historia: { "mz.quienes.title": { es: "Título custom" } },
    });
  });

  it("filters keys using espaciozenit catalog when template is espaciozenit", () => {
    const result = cleanLandingContentForPersistence(
      dicts,
      {
        historia: {
          "mz.quienes.title": { es: "Should drop" },
          "ez.quienes.title": { es: "  Zen title  " },
        },
      },
      "espaciozenit",
    );
    expect(result).toEqual({
      historia: { "ez.quienes.title": { es: "Zen title" } },
    });
  });

  it("persists Portuguese overrides when they differ from pt dictionary defaults", () => {
    const result = cleanLandingContentForPersistence(dicts, {
      historia: {
        "story.title": { pt: "  Título PT custom  " },
      },
    });
    expect(result).toEqual({
      historia: {
        "story.title": { pt: "Título PT custom" },
      },
    });
  });

  it("drops sections when all values are empty after processing", () => {
    const result = cleanLandingContentForPersistence(dicts, {
      historia: { "story.title": { es: "" } },
      modalidades: { "modalities.title": {} },
    });
    expect(result).toEqual({});
  });
});
