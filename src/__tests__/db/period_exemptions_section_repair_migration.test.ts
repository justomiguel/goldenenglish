/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// REGRESSION CHECK: legacy monthly exemptions without section_id must be
// repaired when the student has one unambiguous active section, otherwise
// finance section matrices cannot display the exempt month.
describe("063_period_exemptions_section_repair.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/063_period_exemptions_section_repair.sql",
    ),
    "utf-8",
  );

  it("attributes legacy exempt payments to a single active section", () => {
    expect(sql).toMatch(/WITH single_active_section AS/);
    expect(sql).toMatch(/UPDATE public\.payments p/);
    expect(sql).toMatch(/p\.section_id IS NULL/);
    expect(sql).toMatch(/sas\.section_count = 1/);
    expect(sql).toMatch(/p\.status = 'exempt'/);
  });

  it("does not violate existing section-scoped payment rows", () => {
    expect(sql).toMatch(/NOT EXISTS \(/);
    expect(sql).toMatch(/scoped\.section_id = sas\.section_id/);
    expect(sql).toMatch(/scoped\.month = p\.month/);
    expect(sql).toMatch(/scoped\.year = p\.year/);
  });
});
