import { describe, expect, it } from "vitest";
import {
  DEFAULT_GENERIC_THEME_SLUG,
  genericKindFromThemeSlug,
  genericSectionStockPath,
  genericStockPath,
  genericTemplateSelectOptions,
  isGenericInstituteKind,
} from "@/lib/theme/genericInstituteTemplates";

describe("genericInstituteTemplates", () => {
  it("maps each kind to a public/generic stock path", () => {
    expect(genericStockPath("deportes", "favicon.png")).toBe("/generic/deportes/favicon.png");
    expect(genericStockPath("idiomas", "mark.svg")).toBe("/generic/idiomas/mark.svg");
    expect(genericSectionStockPath("musica", "inicio")).toBe("/generic/musica/inicio.jpg");
    expect(genericSectionStockPath("colegio", "certificaciones")).toBe(
      "/generic/colegio/certificaciones.jpg",
    );
  });

  it("keeps a custom slug in the template list", () => {
    expect(genericTemplateSelectOptions("nago")[0]).toBe("nago");
    expect(genericTemplateSelectOptions("")).toContain(DEFAULT_GENERIC_THEME_SLUG);
    expect(genericTemplateSelectOptions("generic-jardin")).not.toContain("nago");
  });

  it("reads the kind from a generic theme slug", () => {
    expect(genericKindFromThemeSlug("generic-colegio")).toBe("colegio");
    expect(genericKindFromThemeSlug("nago")).toBeNull();
    expect(isGenericInstituteKind("jardin")).toBe(true);
    expect(isGenericInstituteKind("classic")).toBe(false);
  });
});
