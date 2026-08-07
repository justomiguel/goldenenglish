// Test group 7 — locale parity
// Spec 7, Test 7: All three dictionaries (en, es, pt) stay structurally identical
// for the sections touched by this spec.
// - dashboard.parent.homeInbox has the same top-level keys in all three.
// - The new progress pillar keys exist in all three.
import { describe, it, expect } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";

const NEW_PROGRESS_KEYS = [
  "pillarProgressTitle",
  "pillarProgressOkDetail",
  "pillarProgressUnknownDetail",
] as const;

describe("Locale parity — dictionary structure (Test 7)", () => {
  it("all three homeInbox sections have the same top-level keys", () => {
    const enKeys = Object.keys(en.dashboard.parent.homeInbox).sort();
    const esKeys = Object.keys(es.dashboard.parent.homeInbox).sort();
    const ptKeys = Object.keys(pt.dashboard.parent.homeInbox).sort();
    expect(esKeys).toEqual(enKeys);
    expect(ptKeys).toEqual(enKeys);
  });

  it("new progress pillar keys exist in English homeInbox", () => {
    for (const key of NEW_PROGRESS_KEYS) {
      expect(
        en.dashboard.parent.homeInbox,
        `en.dashboard.parent.homeInbox.${key} must exist`,
      ).toHaveProperty(key);
    }
  });

  it("new progress pillar keys exist in Spanish homeInbox", () => {
    for (const key of NEW_PROGRESS_KEYS) {
      expect(
        es.dashboard.parent.homeInbox,
        `es.dashboard.parent.homeInbox.${key} must exist`,
      ).toHaveProperty(key);
    }
  });

  it("new progress pillar keys exist in Portuguese homeInbox", () => {
    for (const key of NEW_PROGRESS_KEYS) {
      expect(
        pt.dashboard.parent.homeInbox,
        `pt.dashboard.parent.homeInbox.${key} must exist`,
      ).toHaveProperty(key);
    }
  });

  it("all new progress pillar keys are non-empty strings in all three locales", () => {
    const dicts = [
      { locale: "en", dict: en },
      { locale: "es", dict: es },
      { locale: "pt", dict: pt },
    ];
    for (const { locale, dict } of dicts) {
      for (const key of NEW_PROGRESS_KEYS) {
        const val = (dict.dashboard.parent.homeInbox as Record<string, unknown>)[key];
        expect(val, `${locale}.homeInbox.${key} must be a non-empty string`).toBeTruthy();
      }
    }
  });
});
