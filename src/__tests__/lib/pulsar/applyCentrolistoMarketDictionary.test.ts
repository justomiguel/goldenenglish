// REGRESSION CHECK: Argentina and Uruguay use voseo. Chile, Paraguay, and English do not.
import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import en from "@/dictionaries/en.json";
import type { Dictionary } from "@/types/i18n";
import { applyCentrolistoMarketDictionary } from "@/lib/pulsar/applyCentrolistoMarketDictionary";

const spanish = es as unknown as Dictionary;
const english = en as unknown as Dictionary;
const SHOP = 2;

function shopLine(dict: Dictionary): string {
  const line = dict.pulsar.pricing.features.ecosistema[SHOP];
  return typeof line === "string" ? line : "";
}

describe("applyCentrolistoMarketDictionary", () => {
  it("uses voseo for Argentina and Uruguay", () => {
    expect(shopLine(applyCentrolistoMarketDictionary(spanish, "es", "ar"))).toContain("Podés crear");
    expect(shopLine(applyCentrolistoMarketDictionary(spanish, "es", "uy"))).toContain("Podés crear");
  });

  it("keeps tuteo for Chile and Paraguay", () => {
    expect(shopLine(applyCentrolistoMarketDictionary(spanish, "es", "cl"))).toContain("Puedes crear");
    expect(shopLine(applyCentrolistoMarketDictionary(spanish, "es", "py"))).toContain("Puedes crear");
    expect(applyCentrolistoMarketDictionary(spanish, "es", "cl").pulsar.solutionSet.presencia.lead).toMatch(/\bElige\b/);
  });

  it("does not mix tuteo imperatives into the Argentina lead", () => {
    const lead = applyCentrolistoMarketDictionary(spanish, "es", "ar").pulsar.solutionSet.presencia.lead;
    expect(lead).toContain("Elegí");
    expect(lead).toContain("agregá");
    expect(lead).toContain("empezá");
    expect(lead).not.toContain("Elige");
    expect(lead).not.toContain("empieza");
  });

  it("keeps English when the country is Argentina", () => {
    const applied = applyCentrolistoMarketDictionary(english, "en", "ar");
    expect(applied).toBe(english);
    expect(shopLine(applied)).not.toContain("Podés");
  });
});
