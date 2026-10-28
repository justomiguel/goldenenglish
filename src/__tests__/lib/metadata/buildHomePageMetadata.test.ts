import { describe, it, expect } from "vitest";
import {
  buildHomePageMetadata,
  buildLocalePageAlternates,
  openGraphLocaleForInstitute,
  pageLocaleFromPublicPath,
} from "@/lib/metadata/buildHomePageMetadata";

describe("buildHomePageMetadata", () => {
  it("uses an absolute title equal to the brand name when tagline is absent", () => {
    const result = buildHomePageMetadata("Espacio Zenit");
    expect(result.title).toEqual({ absolute: "Espacio Zenit" });
  });

  it("joins brand and tagline with an em dash and no pipe", () => {
    const result = buildHomePageMetadata(
      "Mozarthitos",
      "Educación musical temprana en Las Condes",
    );
    expect(result.title).toEqual({
      absolute: "Mozarthitos — Educación musical temprana en Las Condes",
    });
  });

  it("does not put a pipe in the absolute title", () => {
    const result = buildHomePageMetadata("Golden English", "Inglés | Formosa");
    const title = result.title;
    expect(title).toEqual({ absolute: "Golden English — Inglés — Formosa" });
    if (title && typeof title === "object" && "absolute" in title) {
      expect(String(title.absolute)).not.toContain("|");
    }
  });

  it("builds locale alternates for a public subpage", () => {
    expect(buildLocalePageAlternates("es", "/preguntas")).toEqual({
      canonical: "/es/preguntas",
      languages: {
        es: "/es/preguntas",
        en: "/en/preguntas",
        pt: "/pt/preguntas",
        "x-default": "/es/preguntas",
      },
    });
  });

  it("reads the page locale from a public path", () => {
    expect(pageLocaleFromPublicPath("/es/preguntas")).toBe("es");
    expect(pageLocaleFromPublicPath("/en")).toBe("en");
    expect(pageLocaleFromPublicPath("/pt/blog/post")).toBe("pt");
    expect(pageLocaleFromPublicPath("/")).toBe("es");
  });

  it("uses Chile Open Graph locales for Chile tenants", () => {
    expect(openGraphLocaleForInstitute("mozarthitos", "es")).toBe("es_CL");
    expect(openGraphLocaleForInstitute("nago", "pt")).toBe("pt_CL");
    expect(openGraphLocaleForInstitute("liora", "en")).toBe("en_US");
    expect(openGraphLocaleForInstitute("espaciozenit", "es")).toBe("es_CL");
  });

  it("uses Argentina Open Graph locales for Golden and Mi Mundo", () => {
    expect(openGraphLocaleForInstitute("classic", "es")).toBe("es_AR");
    expect(openGraphLocaleForInstitute("editorial", "es")).toBe("es_AR");
    expect(openGraphLocaleForInstitute("mimundo", "pt")).toBe("pt_AR");
    expect(openGraphLocaleForInstitute(null, "es")).toBe("es_AR");
  });
});
