import { describe, expect, it } from "vitest";
import {
  SKIN_FIELDS,
  SKIN_LISTS,
  SKIN_LONG_FIELDS,
  SKIN_PHOTO_SLOT,
  SKIN_PRIMARY_LIST,
  type SkinSectionId,
  SKIN_SECTION_IDS,
} from "@/lib/landing/skin/skinModel";

// REGRESSION CHECK: renaming a section id or field breaks stored skin_content and every skin renderer.
describe("skinModel", () => {
  it("lists the 11 canonical sections in render order", () => {
    expect(SKIN_SECTION_IDS).toEqual([
      "inicio", "ritmo", "historia", "oferta", "metodo", "horarios",
      "equipo", "comunidad", "admision", "faq", "contacto",
    ]);
  });

  it("gives every section a label field", () => {
    for (const id of SKIN_SECTION_IDS) {
      if (id === "ritmo") continue;
      expect(SKIN_FIELDS[id]).toContain("label");
    }
  });

  it("caps every list", () => {
    expect(SKIN_LISTS.oferta?.items.max).toBe(12);
    expect(SKIN_LISTS.horarios?.slots.max).toBe(40);
    expect(SKIN_LISTS.faq?.entries.max).toBe(12);
  });

  it("keeps the existing photo slot keys", () => {
    expect(SKIN_PHOTO_SLOT.metodo).toBe("modalidades::1");
    expect(SKIN_PHOTO_SLOT.comunidad).toBe("certificaciones::1");
    expect(SKIN_PHOTO_SLOT.equipo).toBeUndefined();
  });

  it("points every primary list at a real list and gives every list a positive integer max", () => {
    for (const [section, name] of Object.entries(SKIN_PRIMARY_LIST)) {
      expect(Object.keys(SKIN_LISTS[section as SkinSectionId] ?? {})).toContain(name);
    }
    for (const lists of Object.values(SKIN_LISTS)) {
      for (const spec of Object.values(lists)) {
        expect(Number.isInteger(spec.max)).toBe(true);
        expect(spec.max).toBeGreaterThan(0);
      }
    }
  });

  it("marks detail and a as long fields", () => {
    for (const field of ["body", "closingBody", "laterBody", "detail", "a"]) {
      expect(SKIN_LONG_FIELDS.has(field)).toBe(true);
    }
  });
});
