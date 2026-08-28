/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("193_registration_section_options_hide_full.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/193_registration_section_options_hide_full.sql",
    ),
    "utf-8",
  );

  it("redefines the public listing RPC", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.list_registration_section_options\(\)/,
    );
    expect(sql).toMatch(/RETURNS TABLE \(id uuid, label text\)/);
    expect(sql).toMatch(/SECURITY DEFINER/);
  });

  it("keeps current-cohort and archive guards", () => {
    expect(sql).toMatch(/c\.is_current = true/);
    expect(sql).toMatch(/c\.archived_at IS NULL/);
    expect(sql).toMatch(/s\.archived_at IS NULL/);
  });

  it("hides sections whose active enrollments already fill max_students", () => {
    expect(sql).toMatch(/s\.max_students IS NULL/);
    expect(sql).toMatch(/section_enrollments/);
    expect(sql).toMatch(/se\.status = 'active'/);
    expect(sql).toMatch(/< s\.max_students/);
  });

  it("stays callable by anonymous visitors", () => {
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.list_registration_section_options\(\) TO anon/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.list_registration_section_options\(\) TO authenticated/,
    );
  });
});
