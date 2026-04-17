import { describe, expect, it } from "vitest";
import {
  createSiteThemeInputSchema,
  duplicateSiteThemeInputSchema,
  renameSiteThemeInputSchema,
  siteThemeNameSchema,
  siteThemeSlugSchema,
} from "@/lib/cms/siteThemeInputSchemas";

// REGRESSION CHECK: these schemas decide what the admin actions accept.
// Any change in min/max boundaries or accepted slug characters MUST update the
// migration / UI helpers in the same change so we don't accept input the DB
// later rejects.

describe("siteThemeNameSchema", () => {
  it("accepts trimmed names between 2 and 80 chars", () => {
    expect(siteThemeNameSchema.parse(" Default ")).toBe("Default");
  });
  it("rejects too short or too long", () => {
    expect(siteThemeNameSchema.safeParse("x").success).toBe(false);
    expect(siteThemeNameSchema.safeParse("x".repeat(81)).success).toBe(false);
  });
});

describe("siteThemeSlugSchema", () => {
  it("accepts kebab-case ASCII", () => {
    expect(siteThemeSlugSchema.parse("default")).toBe("default");
    expect(siteThemeSlugSchema.parse("navidad-2026")).toBe("navidad-2026");
  });
  it("rejects spaces, accents, leading/trailing dashes, uppercase", () => {
    expect(siteThemeSlugSchema.safeParse("Default").success).toBe(false);
    expect(siteThemeSlugSchema.safeParse("nav idad").success).toBe(false);
    expect(siteThemeSlugSchema.safeParse("año").success).toBe(false);
    expect(siteThemeSlugSchema.safeParse("-default").success).toBe(false);
    expect(siteThemeSlugSchema.safeParse("default-").success).toBe(false);
  });
});

describe("createSiteThemeInputSchema", () => {
  it("defaults activate to false", () => {
    const parsed = createSiteThemeInputSchema.parse({
      locale: "en",
      name: "Navidad",
      slug: "navidad",
    });
    expect(parsed.activate).toBe(false);
  });

  it("rejects missing locale or invalid slug", () => {
    expect(
      createSiteThemeInputSchema.safeParse({
        locale: "",
        name: "Navidad",
        slug: "navidad",
      }).success,
    ).toBe(false);
    expect(
      createSiteThemeInputSchema.safeParse({
        locale: "en",
        name: "Navidad",
        slug: "Navidad",
      }).success,
    ).toBe(false);
  });
});

describe("renameSiteThemeInputSchema", () => {
  it("requires a uuid id", () => {
    expect(
      renameSiteThemeInputSchema.safeParse({
        locale: "en",
        id: "not-a-uuid",
        name: "X X",
      }).success,
    ).toBe(false);
  });
});

describe("duplicateSiteThemeInputSchema", () => {
  it("requires sourceId uuid + name + slug", () => {
    const parsed = duplicateSiteThemeInputSchema.safeParse({
      locale: "en",
      sourceId: "550e8400-e29b-41d4-a716-446655440000",
      name: "Aniversario copia",
      slug: "aniversario-copia",
    });
    expect(parsed.success).toBe(true);
  });
});
