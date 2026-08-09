// REGRESSION CHECK: the family branch of `cohort_assessments_select_scope` used to join two tables
// whose policies reference each other, which made a tutor's read die on statement_timeout and the
// parent Progress screen show nothing. If the inline join or SECURITY INVOKER ever comes back, the
// same silent outage comes back with it.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/177_cohort_assessments_family_read_no_rls_cycle.sql"),
  "utf8",
);

const familyHelper = sql.slice(
  sql.indexOf("FUNCTION public.user_is_family_of_cohort"),
  sql.indexOf("COMMENT ON FUNCTION public.user_is_family_of_cohort"),
);

const policy = sql.slice(sql.indexOf("CREATE POLICY cohort_assessments_select_scope"));

describe("migration 177 — family reads of cohort assessments", () => {
  it("adds a family membership helper that escapes RLS", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.user_is_family_of_cohort\(p_user UUID, p_cohort_id UUID\)/i,
    );
    expect(familyHelper).toMatch(/SECURITY DEFINER/i);
    expect(familyHelper).toMatch(/SET search_path = public/i);
    expect(familyHelper).toMatch(/STABLE/i);
  });

  it("keeps the predicate families already passed: the student, or a tutor of that student", () => {
    expect(familyHelper).toMatch(/e\.student_id = p_user/i);
    expect(familyHelper).toMatch(/ts\.tutor_id = p_user/i);
    expect(familyHelper).toMatch(/ts\.student_id = e\.student_id/i);
    expect(familyHelper).toMatch(/s\.cohort_id = p_cohort_id/i);
  });

  it("grants both helpers to authenticated, or the policy would deny everyone", () => {
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.user_is_family_of_cohort\(uuid, uuid\) TO authenticated/i,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.cohort_assessment_teacher_can_see\(uuid\) TO authenticated/i,
    );
  });

  it("stops the teacher helper from re-entering the relation its own policy filters", () => {
    const teacherHelper = sql.slice(
      sql.indexOf("FUNCTION public.cohort_assessment_teacher_can_see"),
      sql.indexOf("COMMENT ON FUNCTION public.cohort_assessment_teacher_can_see"),
    );
    expect(teacherHelper).toMatch(/SECURITY DEFINER/i);
    expect(teacherHelper).not.toMatch(/SECURITY INVOKER/i);
    expect(teacherHelper).toMatch(/s\.teacher_id = auth\.uid\(\)/i);
  });

  it("resolves the policy through helpers only, with no inline join left", () => {
    expect(policy).toMatch(/public\.user_is_family_of_cohort\(\(SELECT auth\.uid\(\)\), cohort_id\)/i);
    expect(policy).toMatch(/public\.cohort_assessment_teacher_can_see\(id\)/i);
    expect(policy).not.toMatch(/JOIN/i);
    expect(policy).not.toMatch(/section_enrollments/i);
  });

  it("reads auth.uid() once as an initplan rather than per row", () => {
    expect(policy).toMatch(/public\.is_admin\(\(SELECT auth\.uid\(\)\)\)/i);
    expect(policy).not.toMatch(/is_admin\(auth\.uid\(\)\)/i);
  });

  it("indexes the tutor side the helper filters on", () => {
    expect(sql).toMatch(
      /CREATE INDEX IF NOT EXISTS tutor_student_rel_tutor_student_idx[\s\S]*?\(tutor_id, student_id\)/i,
    );
  });

  it("destroys no data", () => {
    expect(sql).not.toMatch(/\b(DROP TABLE|TRUNCATE|DELETE FROM|DROP COLUMN)\b/i);
  });
});
