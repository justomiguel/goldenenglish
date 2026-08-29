/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("197_registration_section_picker_options.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/197_registration_section_picker_options.sql",
    ),
    "utf-8",
  );

  it("adds a public picker RPC that includes full sections", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.list_registration_section_picker_options\(\)/,
    );
    expect(sql).toMatch(/has_open_seat boolean/);
    expect(sql).toMatch(/offers_trial boolean/);
    expect(sql).toMatch(/schedule_slots/);
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/c\.is_current = true/);
    expect(sql).toMatch(/s\.archived_at IS NULL/);
  });

  it("counts active enrollments and held trial seats as occupied", () => {
    expect(sql).toMatch(/registration_trial_seats/);
    expect(sql).toMatch(/status IN \('booked', 'attended'\)/);
    expect(sql).toMatch(/se\.status = 'active'/);
    expect(sql).toMatch(/COALESCE\(s\.offers_trial, c\.offers_trial\)/);
  });

  it("updates the legacy listing RPC occupancy to include trial seats", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.list_registration_section_options\(\)/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.list_registration_section_picker_options\(\) TO anon/,
    );
  });

  it("is additive", () => {
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/i);
  });
});
