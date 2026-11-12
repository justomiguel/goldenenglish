import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FONT_CATALOG } from "@/lib/design-tokens/fontCatalog";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/273_design_tokens_font_ids.sql"),
  "utf8",
);

describe("273_design_tokens_font_ids", () => {
  it("does not delete rows or drop objects", () => {
    expect(sql.toLowerCase()).not.toMatch(/\bdelete\b/);
    expect(sql.toLowerCase()).not.toMatch(/\bdrop\b/);
  });

  it("lists every open catalog family", () => {
    const open = FONT_CATALOG.filter((font) => font.owner === null);
    expect(open.length).toBeGreaterThan(0);
    for (const font of open) {
      expect(sql).toContain(`'${font.id}'`);
      expect(sql.toLowerCase()).toContain(`'${font.family.toLowerCase()}'`);
    }
  });
});
