import type {
  AdminUserTutorFamilySectionOptionVM,
  AdminUserTutorFamilyStudentVM,
} from "@/lib/dashboard/adminUserDetailVM";
import { resolveEffectiveSectionFeePlan } from "@/lib/billing/resolveEffectiveSectionFeePlan";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { mapSectionFeePlanRow, type SectionFeePlanRowDb } from "@/types/sectionFeePlan";

/** Matches `listTutorStudentsWithFinance` ceiling — guardian-linked sets stay bounded. */
export const MAX_TUTOR_FAMILY_STUDENTS = 200;

type EnrollmentSectionRow = {
  section_id: string;
  academic_sections:
    | { name: string | null }
    | { name: string | null }[]
    | null;
};

function academicSectionNameFromEnrollmentRow(row: EnrollmentSectionRow): string {
  const raw = row.academic_sections;
  const sec = Array.isArray(raw) ? raw[0] : raw;
  const n = sec?.name?.trim();
  return n && n.length > 0 ? n : row.section_id;
}

function normalizedRelationship(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.length > 0 ? s : null;
}

export async function loadStudentsLinkedToTutorForAdminDetail(
  admin: SupabaseClient,
  tutorId: string,
  emptyDisplay: string,
): Promise<AdminUserTutorFamilyStudentVM[]> {
  const { data: rels, error } = await admin
    .from("tutor_student_rel")
    .select("student_id, financial_access_revoked_at, relationship")
    .eq("tutor_id", tutorId)
    .order("student_id", { ascending: true })
    .limit(MAX_TUTOR_FAMILY_STUDENTS);
  if (error) {
    logSupabaseClientError("loadStudentsLinkedToTutor:tutor_student_rel", error, { tutorId });
    return [];
  }
  if (!rels?.length) return [];
  const studentIds = [...new Set(rels.map((r) => String(r.student_id)))];
  const relRevoked = new Map<string, boolean>();
  const relationshipByStudent = new Map<string, string | null>();
  for (const r of rels) {
    const sid = String(r.student_id);
    relRevoked.set(sid, r.financial_access_revoked_at != null);
    relationshipByStudent.set(sid, normalizedRelationship(r.relationship));
  }
  const out: AdminUserTutorFamilyStudentVM[] = [];
  for (const studentId of studentIds) {
    const [{ data: sp }, { data: authS }] = await Promise.all([
      admin.from("profiles").select("first_name, last_name, is_minor").eq("id", studentId).maybeSingle(),
      admin.auth.admin.getUserById(studentId),
    ]);
    const name = sp ? formatProfileNameSurnameFirst(sp.first_name, sp.last_name) : "";
    const em = authS?.user?.email?.trim() ?? "";
    const revoked = relRevoked.get(studentId) === true;
    out.push({
      studentId,
      displayName: name.length > 0 ? name : emptyDisplay,
      emailDisplay: em.length > 0 ? em : emptyDisplay,
      isMinor: sp?.is_minor === true,
      financialAccessActive: !revoked,
      relationshipCode: relationshipByStudent.get(studentId) ?? null,
    });
  }
  out.sort((a, b) =>
    a.displayName.toLocaleLowerCase().localeCompare(b.displayName.toLocaleLowerCase()),
  );
  return out;
}

export async function loadTutorFamilyScholarshipSectionsForAdminDetail(
  admin: SupabaseClient,
  studentIds: string[],
): Promise<AdminUserTutorFamilySectionOptionVM[]> {
  if (studentIds.length === 0) return [];
  const { data: enrollRows, error } = await admin
    .from("section_enrollments")
    .select("section_id, academic_sections(name)")
    .eq("status", "active")
    .in("student_id", studentIds);
  if (error) {
    logSupabaseClientError("loadTutorFamilyScholarshipSections:section_enrollments", error, {
      studentCount: studentIds.length,
    });
    return [];
  }
  const bySection = new Map<string, string>();
  const sectionIds: string[] = [];
  for (const raw of enrollRows ?? []) {
    const row = raw as EnrollmentSectionRow;
    const sid = String(row.section_id);
    if (!bySection.has(sid)) {
      bySection.set(sid, academicSectionNameFromEnrollmentRow(row));
      sectionIds.push(sid);
    }
  }

  const refNow = new Date();
  const refYear = refNow.getFullYear();
  const refMonth = refNow.getMonth() + 1;
  const feeBySection = new Map<string, { amount: number | null; currency: string | null }>();

  if (sectionIds.length > 0) {
    const { data: planRows, error: planErr } = await admin
      .from("section_fee_plans")
      .select(
        "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
      )
      .is("archived_at", null)
      .in("section_id", sectionIds);
    if (planErr) {
      logSupabaseClientError("loadTutorFamilyScholarshipSections:fee_plans", planErr, {
        sectionCount: sectionIds.length,
      });
    } else {
      const plansBySection = new Map<string, ReturnType<typeof mapSectionFeePlanRow>[]>();
      for (const rawPlan of planRows ?? []) {
        const plan = mapSectionFeePlanRow(rawPlan as SectionFeePlanRowDb);
        const list = plansBySection.get(plan.sectionId) ?? [];
        list.push(plan);
        plansBySection.set(plan.sectionId, list);
      }
      for (const sid of sectionIds) {
        const eff = resolveEffectiveSectionFeePlan(plansBySection.get(sid) ?? [], refYear, refMonth);
        feeBySection.set(sid, {
          amount: eff?.monthlyFee ?? null,
          currency: eff?.currency ?? null,
        });
      }
    }
  }

  const options: AdminUserTutorFamilySectionOptionVM[] = [...bySection.entries()].map(
    ([sectionId, sectionLabel]) => ({
      sectionId,
      sectionLabel,
      monthlyFeeAmount: feeBySection.get(sectionId)?.amount ?? null,
      monthlyFeeCurrency: feeBySection.get(sectionId)?.currency ?? null,
    }),
  );
  options.sort((a, b) =>
    a.sectionLabel.toLocaleLowerCase().localeCompare(b.sectionLabel.toLocaleLowerCase()),
  );
  return options;
}
