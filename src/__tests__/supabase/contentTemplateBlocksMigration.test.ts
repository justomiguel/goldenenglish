// REGRESSION CHECK: global content blocks must be a real persisted composition
// layer, while staying safe if older template migrations are not present.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("content template blocks migration", () => {
  it("creates ordered blocks behind an existence guard", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/072_content_template_blocks.sql"),
      "utf8",
    );

    expect(sql).toMatch(/content_template_block_kind/);
    expect(sql).toMatch(/to_regclass\('public\.content_templates'\)/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.content_template_blocks/);
    expect(sql).toMatch(/sort_order INT NOT NULL DEFAULT 0/);
    expect(sql).toMatch(/payload JSONB NOT NULL DEFAULT '\{\}'::jsonb/);
    expect(sql).toMatch(/template_id, sort_order, created_at/);
  });
});
