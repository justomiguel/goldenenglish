/** @vitest-environment node */
// REGRESSION CHECK: Public registration cohort resolution and DNI student/tutor prefill RPCs must stay SECURITY DEFINER and preserve anon/authenticated grants.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("227_registration_cohort_and_student_lookup.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/227_registration_cohort_and_student_lookup.sql",
    ),
    "utf-8",
  );

  it("defines resolve_public_registration_cohort_id reading site_settings with is_current fallback", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.resolve_public_registration_cohort_id\(\)/,
    );
    expect(sql).toMatch(/registration_cohort_id/);
    expect(sql).toMatch(/is_current = true/);
    expect(sql).toMatch(/archived_at IS NULL/);
  });

  it("updates list_registration_section_picker_options to accept optional p_cohort_id", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.list_registration_section_picker_options\(\s*p_cohort_id uuid DEFAULT NULL\s*\)/,
    );
    expect(sql).toMatch(
      /COALESCE\(p_cohort_id, public\.resolve_public_registration_cohort_id\(\)\)/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.list_registration_section_picker_options\(uuid\) TO anon/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.list_registration_section_picker_options\(uuid\) TO authenticated/,
    );
  });

  it("updates registration_public_section_label and registration_public_section_has_open_seat for configured cohort and admin", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.registration_public_section_label\(p_section_id uuid\)/,
    );
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.registration_public_section_has_open_seat\(p_section_id uuid\)/,
    );
    expect(sql).toMatch(/public\.resolve_public_registration_cohort_id\(\)/);
    expect(sql).toMatch(/public\.is_admin\(auth\.uid\(\)\)/);
  });

  it("expands lookup_registration_student with birth_date, contact, and tutor prefill columns", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.lookup_registration_student\(p_dni text\)/,
    );
    expect(sql).toMatch(/birth_date text/);
    expect(sql).toMatch(/tutor_name text/);
    expect(sql).toMatch(/tutor_dni text/);
    expect(sql).toMatch(/tutor_email text/);
    expect(sql).toMatch(/tutor_phone text/);
    expect(sql).toMatch(/tutor_relationship text/);
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.lookup_registration_student\(text\) TO anon, authenticated/,
    );
  });
});
