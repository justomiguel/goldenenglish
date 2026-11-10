import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PRODUCT_CHANGELOG_AREAS, resolveProductChangelogCopy } from "@/lib/product-changelog/catalog";
import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";

const LOCALES = ["es", "en", "pt"] as const;
const REQUIRED_IDS = [
  "matiss-locations-sunday",
  "matiss-header-seal",
  "nago-nunoa-dark-landing",
  "directory-quota-enrollment-status",
  "directory-monthly-status-column-filter",
  "join-payment-disposition",
  "trial-classes",
  "enrollment-fee-checkout",
  "parent-pwa-portal",
];

const SEED = readFileSync(
  resolve("supabase/pulsar-migrations/020_platform_changelog.sql"),
  "utf8",
);

function seedRows(): { id: string; date: string; area: string }[] {
  return [...SEED.matchAll(/\$gecl\$([a-z0-9-]+)\$gecl\$, \$gecl\$(\d{4}-\d{2}-\d{2})\$gecl\$::date, \$gecl\$([a-z]+)\$gecl\$/g)].map(
    (match) => ({ id: match[1], date: match[2], area: match[3] }),
  );
}

const fixture: ProductChangelogEntry = {
  id: "section-share-photo",
  date: "2026-08-29",
  area: "academic",
  title: { es: "Foto de la sección", en: "Section photo", pt: "Foto da turma" },
  summary: {
    es: "Cada sección puede tener una foto para el link de inscripción.",
    en: "Each section can have a photo on its enrollment link.",
    pt: "Cada turma pode ter uma foto no link de inscrição.",
  },
};

describe("product changelog catalog", () => {
  it("resolves title and summary in every locale", () => {
    for (const locale of LOCALES) {
      const copy = resolveProductChangelogCopy(fixture, locale);
      expect(copy.title).toBe(fixture.title[locale]);
      expect(copy.summary).toBe(fixture.summary[locale]);
    }
    expect(resolveProductChangelogCopy(fixture, "fr").title).toBe(fixture.title.es);
  });

  it("seeds unique notes with a date and a known area", () => {
    const rows = seedRows();
    expect(rows.length).toBeGreaterThanOrEqual(20);
    const ids = rows.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const row of rows) {
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(PRODUCT_CHANGELOG_AREAS).toContain(row.area);
    }
    for (const id of REQUIRED_IDS) {
      expect(ids).toContain(id);
    }
  });
});
