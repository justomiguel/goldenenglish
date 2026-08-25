/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("188_registration_additional_sections.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/188_registration_additional_sections.sql"),
    "utf-8",
  );

  it("adds additional_section_ids on registrations", () => {
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS additional_section_ids UUID\[\] NOT NULL DEFAULT '\{\}'/,
    );
  });

  it("defines lookup_registration_student with the public name-only shape", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.lookup_registration_student\(p_dni text\)/,
    );
    expect(sql).toMatch(/RETURNS TABLE \(found boolean, first_name text, last_name text\)/);
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/role = 'student'/);
  });

  it("revokes PUBLIC then grants execute to anon and authenticated", () => {
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.lookup_registration_student\(text\) FROM PUBLIC/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.lookup_registration_student\(text\) TO anon, authenticated/,
    );
  });

  it("does not expose email, profile id, phone, or enrollments", () => {
    const fnStart = sql.indexOf("lookup_registration_student");
    const fnBody = sql.slice(fnStart);
    expect(fnBody).not.toMatch(/\bemail\b/i);
    expect(fnBody).not.toMatch(/\bphone\b/i);
    expect(fnBody).not.toMatch(/section_enrollments/i);
    expect(fnBody).not.toMatch(/p\.id/);
  });
});
