import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import { isGenericLandingCopyKey } from "@/lib/cms/genericLandingCopyKeys";
import { buildGenericSiteCopyFields } from "@/lib/landing/genericSiteCopyFields";
import type { Dictionary } from "@/types/i18n";

const dict = es as Dictionary;
const labels = dict.pulsar.account.siteCopy;

describe("buildGenericSiteCopyFields", () => {
  it("lists a name and the visible text, and keeps every section", () => {
    const fields = buildGenericSiteCopyFields({
      kind: "deportes",
      dict,
      content: {
        inicio: { "genericLandings.deportes.title": { es: "Título editado" } },
      },
      locale: "es",
      labels,
    });
    const keys = fields.map((field) => field.key);
    expect(keys).toContain("genericSectionLabels.historia");
    expect(keys).toContain("genericSectionLabels.contacto");
    expect(keys).not.toContain("genericSectionLabels.equipo");
    expect(fields.find((field) => field.key === "genericLandings.deportes.title")?.value).toBe(
      "Título editado",
    );
    expect(fields.filter((field) => field.required).length).toBeGreaterThan(5);
    expect(isGenericLandingCopyKey("genericSectionLabels.inicio")).toBe(true);
  });

  it("includes Equipo on the second sports template", () => {
    const fields = buildGenericSiteCopyFields({
      kind: "deportes2",
      dict,
      content: null,
      locale: "es",
      labels,
    });
    expect(fields.some((field) => field.key === "genericSectionLabels.equipo")).toBe(true);
  });
});
