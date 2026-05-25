import { describe, expect, it } from "vitest";
import {
  MIMUNDO_EDITABLE_COPY_KEYS,
  MIMUNDO_LANDING_COPY_KEYS_BY_SECTION,
  MIMUNDO_MEDIA_SLOTS_BY_SECTION,
} from "@/lib/cms/landingMimundoCatalog";
import { LANDING_SECTION_SLUGS } from "@/types/theming";

describe("MIMUNDO_LANDING_COPY_KEYS_BY_SECTION", () => {
  it("has an entry for every canonical section slug", () => {
    for (const slug of LANDING_SECTION_SLUGS) {
      expect(MIMUNDO_LANDING_COPY_KEYS_BY_SECTION).toHaveProperty(slug);
    }
  });

  it("contains no empty section arrays", () => {
    for (const [section, keys] of Object.entries(MIMUNDO_LANDING_COPY_KEYS_BY_SECTION)) {
      expect(keys.length).toBeGreaterThan(0);
      // All keys are prefixed with mm.
      for (const key of keys) {
        expect(key).toMatch(/^mm\./);
      }
    }
  });

  it("inicio section contains CTA and hero keys", () => {
    const inicio = MIMUNDO_LANDING_COPY_KEYS_BY_SECTION.inicio;
    expect(inicio).toContain("mm.hero.ctaReservar");
    expect(inicio).toContain("mm.hero.kicker");
    expect(inicio).toContain("mm.hero.title");
  });

  it("modalidades section lists all 6 sala keys", () => {
    const modal = MIMUNDO_LANDING_COPY_KEYS_BY_SECTION.modalidades;
    const rooms = ["bebes", "sala1", "sala2", "sala3", "sala4", "sala5"];
    for (const room of rooms) {
      expect(modal).toContain(`mm.salas.${room}.nombre`);
      expect(modal).toContain(`mm.salas.${room}.edades`);
      expect(modal).toContain(`mm.salas.${room}.descripcion`);
    }
  });

  it("certificaciones section contains contact and footer keys", () => {
    const certs = MIMUNDO_LANDING_COPY_KEYS_BY_SECTION.certificaciones;
    expect(certs).toContain("mm.contact.direccion");
    expect(certs).toContain("mm.contact.email");
    expect(certs).toContain("mm.footer.rightsLine");
  });
});

describe("MIMUNDO_MEDIA_SLOTS_BY_SECTION", () => {
  it("has an entry for every canonical section slug", () => {
    for (const slug of LANDING_SECTION_SLUGS) {
      expect(MIMUNDO_MEDIA_SLOTS_BY_SECTION).toHaveProperty(slug);
    }
  });

  it("returns positive slot counts for all sections", () => {
    for (const count of Object.values(MIMUNDO_MEDIA_SLOTS_BY_SECTION)) {
      expect(count).toBeGreaterThan(0);
    }
  });

  it("modalidades has 6 media slots (one per sala)", () => {
    expect(MIMUNDO_MEDIA_SLOTS_BY_SECTION.modalidades).toBe(6);
  });
});

describe("MIMUNDO_EDITABLE_COPY_KEYS", () => {
  it("is the flat union of all section keys", () => {
    const flat = Object.values(MIMUNDO_LANDING_COPY_KEYS_BY_SECTION).flat();
    expect(MIMUNDO_EDITABLE_COPY_KEYS).toEqual(flat);
  });

  it("contains no duplicates", () => {
    const unique = new Set(MIMUNDO_EDITABLE_COPY_KEYS);
    expect(unique.size).toBe(MIMUNDO_EDITABLE_COPY_KEYS.length);
  });
});
