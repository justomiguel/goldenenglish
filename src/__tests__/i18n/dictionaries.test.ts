import { describe, it, expect } from "vitest";
import {
  defaultLocale,
  getDictionary,
  locales,
} from "@/lib/i18n/dictionaries";

describe("getDictionary", () => {
  it("returns es dictionary for es", async () => {
    const d = await getDictionary("es");
    expect(d.common.submit.length).toBeGreaterThan(0);
  });

  it("returns en dictionary for en", async () => {
    const d = await getDictionary("en");
    expect(d.common.submit.length).toBeGreaterThan(0);
  });

  it("falls back to default for unknown locale", async () => {
    const d = await getDictionary("xx");
    const fallback = await getDictionary(defaultLocale);
    expect(d.common.submit).toEqual(fallback.common.submit);
  });

  it("exports locale list", () => {
    expect(locales).toContain("en");
    expect(defaultLocale).toBe("es");
  });
});
