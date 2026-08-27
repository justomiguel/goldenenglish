/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("191_section_enrollment_link_count_includes_enrolled.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/191_section_enrollment_link_count_includes_enrolled.sql",
    ),
    "utf-8",
  );

  it("redefines both count functions without dropping enrolled submissions", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.section_enrollment_link_lead_count\(p_section_id uuid\)/,
    );
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.section_enrollment_link_state\(p_section_id uuid\)/,
    );
    expect(sql).toMatch(/r\.source_section_link_id = p_section_id/);
    expect(sql).not.toMatch(/status\s*<>\s*'enrolled'/i);
  });

  it("keeps the staff-only grants", () => {
    for (const fn of [
      "section_enrollment_link_lead_count",
      "section_enrollment_link_state",
    ]) {
      expect(sql).toMatch(
        new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\(uuid\\) FROM PUBLIC`),
      );
      expect(sql).toMatch(
        new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\(uuid\\) FROM anon`),
      );
      expect(sql).toMatch(
        new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${fn}\\(uuid\\) TO authenticated`),
      );
    }
  });
});
