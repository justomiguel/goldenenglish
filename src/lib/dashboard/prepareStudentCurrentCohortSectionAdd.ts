import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  loadAdminStudentCurrentCohortAssignment,
  type AdminStudentCurrentCohortAssignment,
} from "@/lib/dashboard/loadAdminStudentCurrentCohortAssignment";

const uuid = z.string().uuid();

export type PreparedStudentSectionAdd =
  | {
      ok: true;
      supabase: SupabaseClient;
      studentId: string;
      sectionId: string;
      assignment: AdminStudentCurrentCohortAssignment;
    }
  | {
      ok: false;
      code: "PARSE" | "NOT_STUDENT" | "NO_CURRENT_COHORT" | "SECTION_NOT_CURRENT" | "ALREADY_ACTIVE";
    };

export async function isStudentProfile(supabase: SupabaseClient, studentId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", studentId)
    .maybeSingle();
  return !error && data?.role === "student";
}

export async function prepareStudentCurrentCohortSectionAdd(input: {
  studentId: string;
  sectionId: string;
}): Promise<PreparedStudentSectionAdd> {
  const student = uuid.safeParse(input.studentId);
  const section = uuid.safeParse(input.sectionId);
  if (!student.success || !section.success) return { ok: false, code: "PARSE" };

  const { supabase } = await assertAdmin();
  const isStudent = await isStudentProfile(supabase, student.data);
  if (!isStudent) return { ok: false, code: "NOT_STUDENT" };

  const assignment = await loadAdminStudentCurrentCohortAssignment(supabase, student.data);
  if (!assignment.cohortId) return { ok: false, code: "NO_CURRENT_COHORT" };
  if (!assignment.sections.some((option) => option.id === section.data)) {
    return { ok: false, code: "SECTION_NOT_CURRENT" };
  }
  const alreadyIn = assignment.currentSections.some((cs) => cs.sectionId === section.data);
  if (alreadyIn) return { ok: false, code: "ALREADY_ACTIVE" };

  return { ok: true, supabase, studentId: student.data, sectionId: section.data, assignment };
}
