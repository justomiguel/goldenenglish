import { describe, expect, it } from "vitest";
import {
  LANDING_BLOCK_FIELDS_BY_KIND,
  LANDING_BLOCK_REQUIRED_FIELDS_BY_KIND,
  isLandingBlockCopyValid,
  landingBlockHasField,
} from "@/lib/cms/landingBlockKindFields";

describe("landingBlockHasField", () => {
  it("includes both fields for card / callout / feature / stat / cta / quote", () => {
    for (const kind of ["card", "callout", "feature", "stat", "cta", "quote"] as const) {
      expect(landingBlockHasField(kind, "title")).toBe(true);
      expect(landingBlockHasField(kind, "body")).toBe(true);
    }
  });

  it("excludes body for divider blocks", () => {
    expect(landingBlockHasField("divider", "title")).toBe(true);
    expect(landingBlockHasField("divider", "body")).toBe(false);
  });

  it("matches the explicit field tables exactly", () => {
    for (const kind of Object.keys(LANDING_BLOCK_FIELDS_BY_KIND) as Array<
      keyof typeof LANDING_BLOCK_FIELDS_BY_KIND
    >) {
      const fields = LANDING_BLOCK_FIELDS_BY_KIND[kind];
      const required = LANDING_BLOCK_REQUIRED_FIELDS_BY_KIND[kind];
      for (const r of required) {
        expect(fields).toContain(r);
      }
    }
  });
});

describe("isLandingBlockCopyValid", () => {
  it("requires the title for card-like kinds in at least one locale", () => {
    expect(
      isLandingBlockCopyValid("card", {
        es: { body: "solo cuerpo" },
        en: {},
      }),
    ).toBe(false);
    expect(
      isLandingBlockCopyValid("card", {
        es: { title: "Hola" },
        en: {},
      }),
    ).toBe(true);
    expect(
      isLandingBlockCopyValid("feature", {
        es: {},
        en: { title: "Feature" },
      }),
    ).toBe(true);
  });

  it("requires the body for quote blocks", () => {
    expect(
      isLandingBlockCopyValid("quote", {
        es: { title: "Solo atribución" },
        en: {},
      }),
    ).toBe(false);
    expect(
      isLandingBlockCopyValid("quote", {
        es: { body: "Una cita inspiradora." },
        en: {},
      }),
    ).toBe(true);
  });

  it("requires only the title for divider", () => {
    expect(
      isLandingBlockCopyValid("divider", { es: {}, en: {} }),
    ).toBe(false);
    expect(
      isLandingBlockCopyValid("divider", {
        es: { title: "Capítulo II" },
        en: {},
      }),
    ).toBe(true);
  });

  it("treats whitespace-only values as missing", () => {
    expect(
      isLandingBlockCopyValid("card", {
        es: { title: "   " },
        en: { title: "" },
      }),
    ).toBe(false);
  });
});
