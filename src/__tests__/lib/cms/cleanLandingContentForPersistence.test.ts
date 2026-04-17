import { describe, expect, it } from "vitest";
import enDict from "@/dictionaries/en.json";
import esDict from "@/dictionaries/es.json";
import { cleanLandingContentForPersistence } from "@/lib/cms/cleanLandingContentForPersistence";
import type { Dictionary } from "@/types/i18n";

const dicts = {
  en: enDict as Dictionary,
  es: esDict as Dictionary,
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

  it("drops sections that end up empty", () => {
    const result = cleanLandingContentForPersistence(dicts, {
      historia: { "story.title": { es: "" } },
      modalidades: { "modalities.title": {} },
    });
    expect(result).toEqual({});
  });
});
