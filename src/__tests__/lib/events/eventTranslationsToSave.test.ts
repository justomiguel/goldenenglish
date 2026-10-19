import { describe, expect, it } from "vitest";
import {
  eventTranslationsToSave,
  SaveEventTranslationsInputSchema,
} from "@/lib/events/eventTranslationsToSave";

const image =
  '<p><img src="https://example.supabase.co/storage/v1/object/public/event-media/events/a/foto.png" alt="foto" /></p>';

describe("eventTranslationsToSave", () => {
  it("keeps the default description image when other titles are empty", () => {
    const result = eventTranslationsToSave(
      [
        { locale: "es", title: "Capoeira Me Chama", description: image, location: "Santiago" },
        { locale: "en", title: "", description: "", location: "" },
        { locale: "pt", title: "   ", description: "", location: "" },
      ],
      "es",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows.map((row) => row.locale)).toEqual(["es"]);
    expect(result.defaultRow.description).toContain("foto.png");
  });

  it("copies an image from an empty-title locale onto the default description", () => {
    const result = eventTranslationsToSave(
      [
        { locale: "es", title: "Capoeira Me Chama", description: "<p>Hola</p>", location: null },
        { locale: "en", title: "", description: image, location: null },
        { locale: "pt", title: "", description: "", location: null },
      ],
      "es",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.defaultRow.description).toContain("foto.png");
    expect(result.defaultRow.description).toContain("Hola");
    expect(result.rows).toHaveLength(1);
  });

  it("still saves a locale that has its own title", () => {
    const result = eventTranslationsToSave(
      [
        { locale: "es", title: "Capoeira", description: image, location: null },
        { locale: "en", title: "Capoeira", description: "<p>Hello</p>", location: null },
        { locale: "pt", title: "", description: "", location: null },
      ],
      "es",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows.map((row) => row.locale)).toEqual(["es", "en"]);
  });

  it("accepts empty locales whose location is null", () => {
    const parsed = SaveEventTranslationsInputSchema.safeParse({
      adminLocale: "es",
      eventId: "00000000-0000-4000-8000-000000000001",
      defaultLocale: "es",
      translations: [
        { locale: "es", title: "Capoeira", description: image, location: "Santiago" },
        { locale: "en", title: "", description: "", location: null },
        { locale: "pt", title: "", description: "", location: null },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects a save when the default title is empty", () => {
    const result = eventTranslationsToSave(
      [
        { locale: "es", title: "  ", description: image, location: null },
        { locale: "en", title: "", description: "", location: null },
        { locale: "pt", title: "", description: "", location: null },
      ],
      "es",
    );

    expect(result).toEqual({ ok: false, code: "default_title_required" });
  });
});
