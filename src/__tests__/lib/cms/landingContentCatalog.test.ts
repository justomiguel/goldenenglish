import { describe, expect, it } from "vitest";
import {
  LANDING_COPY_KEYS_BY_SECTION,
  LANDING_MEDIA_SLOTS_BY_SECTION,
  LANDING_OVERRIDE_LOCALES,
  isEditableLandingCopyKey,
  isLandingOverrideLocale,
} from "@/lib/cms/landingContentCatalog";
import { LANDING_SECTION_SLUGS } from "@/types/theming";

describe("landingContentCatalog", () => {
  it("declares an entry for every landing section slug", () => {
    for (const slug of LANDING_SECTION_SLUGS) {
      expect(LANDING_COPY_KEYS_BY_SECTION[slug]).toBeDefined();
      expect(LANDING_MEDIA_SLOTS_BY_SECTION[slug]).toBeGreaterThanOrEqual(0);
    }
  });

  it("exposes editable keys via isEditableLandingCopyKey", () => {
    expect(isEditableLandingCopyKey("hero.kicker")).toBe(true);
    expect(isEditableLandingCopyKey("story.body1")).toBe(true);
    expect(isEditableLandingCopyKey("levels.a1")).toBe(true);
    expect(isEditableLandingCopyKey("certs.cambridge")).toBe(true);
    expect(isEditableLandingCopyKey("collage.alts")).toBe(false);
    expect(isEditableLandingCopyKey("studentGallery.items")).toBe(false);
    expect(isEditableLandingCopyKey("modalities.unknown")).toBe(false);
  });

  it("does not duplicate keys across sections", () => {
    const seen = new Set<string>();
    for (const keys of Object.values(LANDING_COPY_KEYS_BY_SECTION)) {
      for (const key of keys) {
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it("recognizes only the supported locales", () => {
    for (const locale of LANDING_OVERRIDE_LOCALES) {
      expect(isLandingOverrideLocale(locale)).toBe(true);
    }
    expect(isLandingOverrideLocale("fr")).toBe(false);
    expect(isLandingOverrideLocale("")).toBe(false);
  });
});
