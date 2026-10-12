/** @vitest-environment node */
// REGRESSION CHECK: show_on_home stays opt-in (default false) and the partial
// index only covers published public rows.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/208_events_show_on_home.sql"),
  "utf8",
);

describe("208_events_show_on_home", () => {
  it("adds an opt-in flag and a partial index for the home query", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT false/);
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS events_show_on_home_upcoming_idx/);
    expect(sql).toMatch(/private_to_section = false/);
    expect(sql).toMatch(/status = 'published'/);
    expect(sql).toMatch(/archived_at IS NULL/);
  });
});
