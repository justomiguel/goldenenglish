/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";

const REQUIRED = [
  "heading",
  "scheduleLabel",
  "scheduleEmpty",
  "seatsRemainingOne",
  "seatsRemainingMany",
  "waitingListNotice",
  "unavailableTitle",
  "unavailableInvalid",
  "unavailableClosed",
  "backHome",
] as const;

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

describe("register.sectionLink copy", () => {
  const dicts = { en, es, pt } as Record<string, typeof en>;

  for (const [locale, dict] of Object.entries(dicts)) {
    it(`${locale} defines every sectionLink key with a non-empty string`, () => {
      const group = dict.register.sectionLink as Record<string, unknown>;
      expect(group).toBeTruthy();
      for (const key of REQUIRED) {
        expect(typeof group[key], `${locale}.${key}`).toBe("string");
        expect(String(group[key]).trim().length, `${locale}.${key}`).toBeGreaterThan(0);
      }
      const weekdays = group.weekdays as Record<string, unknown>;
      for (const day of WEEKDAYS) {
        expect(typeof weekdays[day], `${locale}.weekdays.${day}`).toBe("string");
        // Non-empty too: a blank label renders a schedule row as a bare time range.
        expect(
          String(weekdays[day]).trim().length,
          `${locale}.weekdays.${day}`,
        ).toBeGreaterThan(0);
      }
    });
  }

  // Only the plural form interpolates: the singular names the one seat outright so the
  // sentence stays grammatical in every locale.
  it("keeps the plural seat copy parameterised on {count}", () => {
    for (const [locale, dict] of Object.entries(dicts)) {
      const group = dict.register.sectionLink as Record<string, string>;
      expect(group.seatsRemainingMany, `${locale}.seatsRemainingMany`).toContain("{count}");
    }
  });
});
