import { describe, expect, it } from "vitest";
import {
  listProductChangelogEntries,
  PRODUCT_CHANGELOG_AREAS,
  resolveProductChangelogCopy,
} from "@/lib/product-changelog/catalog";

const LOCALES = ["es", "en", "pt"] as const;

describe("product changelog catalog", () => {
  it("lists unique entries newest first with a date and area", () => {
    const entries = listProductChangelogEntries();
    expect(entries.length).toBeGreaterThanOrEqual(20);
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of entries) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(PRODUCT_CHANGELOG_AREAS).toContain(entry.area);
    }
    const dates = entries.map((e) => e.date);
    expect(dates).toEqual([...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0)));
  });

  it("resolves title and summary in every locale", () => {
    for (const entry of listProductChangelogEntries()) {
      for (const locale of LOCALES) {
        const copy = resolveProductChangelogCopy(entry, locale);
        expect(copy.title.trim().length).toBeGreaterThan(3);
        expect(copy.summary.trim().length).toBeGreaterThan(12);
      }
    }
  });

  it("includes recent product features extracted from commits", () => {
    const ids = new Set(listProductChangelogEntries().map((e) => e.id));
    expect(ids.has("nago-nunoa-dark-landing")).toBe(true);
    expect(ids.has("directory-quota-enrollment-status")).toBe(true);
    expect(ids.has("join-payment-disposition")).toBe(true);
    expect(ids.has("trial-classes")).toBe(true);
    expect(ids.has("enrollment-fee-checkout")).toBe(true);
    expect(ids.has("parent-pwa-portal")).toBe(true);
  });
});
