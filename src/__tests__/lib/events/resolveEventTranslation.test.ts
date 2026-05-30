import { describe, expect, it } from "vitest";
import { resolveEventTranslation } from "@/lib/events/resolveEventTranslation";

describe("resolveEventTranslation", () => {
  it("returns requested locale when translation exists", () => {
    const result = resolveEventTranslation(
      [
        { locale: "es", title: "Título ES", description: "Desc ES", location: "Santiago" },
        { locale: "en", title: "Title EN", description: "Desc EN", location: "Santiago" },
      ],
      {
        title: "Fallback",
        description: "Fallback desc",
        location: null,
        defaultLocale: "es",
      },
      "en",
    );

    expect(result.title).toBe("Title EN");
    expect(result.localeUsed).toBe("en");
  });

  it("falls back to default locale then base row", () => {
    const result = resolveEventTranslation(
      [{ locale: "es", title: "Solo ES", description: "Desc", location: null }],
      {
        title: "Base title",
        description: "Base desc",
        location: "Valparaíso",
        defaultLocale: "es",
      },
      "pt",
    );

    expect(result.title).toBe("Solo ES");
    expect(result.localeUsed).toBe("es");
  });
});
