/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Unit-test the migration SQL as text. We don't have a Postgres harness in
 * this repo, but we can pin the contract that:
 *   1. The column `is_system_default` is added idempotently (`IF NOT EXISTS`).
 *   2. There is at most one system-default row (partial unique index).
 *   3. The seed is idempotent (`ON CONFLICT (slug) DO UPDATE`).
 *   4. The seed activates the system default only when no other row is
 *      currently active (`NOT EXISTS ... is_active = TRUE`).
 *
 * This guards against accidental regressions of the migration that would
 * either drop the seed or stop preserving an existing active template.
 */
describe("052_site_themes_system_default.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/052_site_themes_system_default.sql",
    ),
    "utf-8",
  );

  it("adds the is_system_default column idempotently", () => {
    expect(sql).toMatch(
      /ALTER TABLE public\.site_themes[\s\S]*ADD COLUMN IF NOT EXISTS is_system_default BOOLEAN NOT NULL DEFAULT FALSE/,
    );
  });

  it("creates a partial unique index so only one row can be the system default", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS site_themes_only_one_system_default[\s\S]*ON public\.site_themes \(is_system_default\)[\s\S]*WHERE is_system_default = TRUE/,
    );
  });

  it("seeds the row idempotently via ON CONFLICT(slug)", () => {
    expect(sql).toMatch(
      /INSERT INTO public\.site_themes[\s\S]*'default'[\s\S]*ON CONFLICT \(slug\) DO UPDATE[\s\S]*SET is_system_default = TRUE/,
    );
  });

  it("only activates the system default when no other row is active", () => {
    expect(sql).toMatch(
      /UPDATE public\.site_themes[\s\S]*SET is_active = TRUE[\s\S]*WHERE is_system_default = TRUE[\s\S]*AND NOT EXISTS \(\s*SELECT 1 FROM public\.site_themes WHERE is_active = TRUE\s*\)/,
    );
  });
});
