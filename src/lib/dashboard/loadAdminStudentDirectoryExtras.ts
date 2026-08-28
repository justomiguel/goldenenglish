import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveEffectiveSectionFeePlan } from "@/lib/billing/resolveEffectiveSectionFeePlan";
import { loadSectionBillingModes } from "@/lib/billing/loadSectionBillingModes";
import { sectionIsClassPackBilled } from "@/lib/billing/sectionBillingMode";
import {
  sumDiscountedMonthlyDue,
  type MonthlyDueLine,
  type MonthlyDueTotal,
} from "@/lib/billing/sumDiscountedMonthlyDue";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { mapSectionFeePlanRow, type SectionFeePlan, type SectionFeePlanRowDb } from "@/types/sectionFeePlan";

export type AdminStudentDirectorySection = {
  id: string;
  name: string;
  cohortId: string | null;
  discountPercent: number | null;
};

export type AdminStudentDirectoryParent = {
  id: string;
  firstName: string;
  lastName: string;
};

export type AdminStudentDirectoryExtras = {
  sectionsByStudent: Map<string, AdminStudentDirectorySection[]>;
  parentsByStudent: Map<string, AdminStudentDirectoryParent[]>;
  monthlyDueByStudent: Map<string, MonthlyDueTotal[]>;
};

type SectionJoin = {
  name: string | null;
  cohort_id: string | null;
};

type EnrollmentRow = {
  student_id: string;
  section_id: string;
  academic_sections: SectionJoin | SectionJoin[] | null;
};

type ScholarshipRow = {
  student_id: string;
  section_id: string;
  discount_percent: number | string | null;
};

type RelRow = {
  student_id: string;
  tutor_id: string;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

export function emptyAdminStudentDirectoryExtras(): AdminStudentDirectoryExtras {
  return {
    sectionsByStudent: new Map(),
    parentsByStudent: new Map(),
    monthlyDueByStudent: new Map(),
  };
}

export function adminAcademicSectionHref(
  locale: string,
  section: Pick<AdminStudentDirectorySection, "id" | "cohortId">,
): string | null {
  const cohortId = section.cohortId?.trim();
  if (!cohortId) return null;
  return `/${locale}/dashboard/admin/academic/${cohortId}/${section.id}`;
}

function sectionMetaFromEnrollment(row: EnrollmentRow): {
  name: string;
  cohortId: string | null;
} {
  const raw = row.academic_sections;
  const sec = Array.isArray(raw) ? raw[0] : raw;
  const n = sec?.name?.trim();
  const cohortId = sec?.cohort_id?.trim() || null;
  return {
    name: n && n.length > 0 ? n : row.section_id,
    cohortId,
  };
}

function parseDiscountPercent(raw: number | string | null): number | null {
  const percent = Number(raw);
  if (!Number.isFinite(percent) || percent <= 0) return null;
  return percent;
}

export async function loadAdminStudentDirectoryExtras(
  admin: SupabaseClient,
  studentIds: string[],
  refDate = new Date(),
): Promise<AdminStudentDirectoryExtras> {
  const ids = studentIds.filter((id) => id.trim().length > 0);
  if (ids.length === 0) return emptyAdminStudentDirectoryExtras();

  const [enrollResult, scholarshipResult, relResult] = await Promise.all([
    admin
      .from("section_enrollments")
      .select("student_id, section_id, academic_sections(name, cohort_id)")
      .in("student_id", ids)
      .eq("status", "active"),
    admin
      .from("section_enrollment_scholarships")
      .select("student_id, section_id, discount_percent")
      .in("student_id", ids)
      .eq("is_active", true),
    admin.from("tutor_student_rel").select("student_id, tutor_id").in("student_id", ids),
  ]);

  if (enrollResult.error) {
    logSupabaseClientError("loadAdminStudentDirectoryExtras:section_enrollments", enrollResult.error, {
      studentCount: ids.length,
    });
  }
  if (scholarshipResult.error) {
    logSupabaseClientError(
      "loadAdminStudentDirectoryExtras:section_enrollment_scholarships",
      scholarshipResult.error,
      { studentCount: ids.length },
    );
  }
  if (relResult.error) {
    logSupabaseClientError("loadAdminStudentDirectoryExtras:tutor_student_rel", relResult.error, {
      studentCount: ids.length,
    });
  }

  const percentByStudentSection = new Map<string, number>();
  for (const raw of (scholarshipResult.data ?? []) as ScholarshipRow[]) {
    const percent = parseDiscountPercent(raw.discount_percent);
    if (percent == null) continue;
    const key = `${raw.student_id}:${raw.section_id}`;
    const prev = percentByStudentSection.get(key);
    if (prev == null || percent > prev) percentByStudentSection.set(key, percent);
  }

  const sectionsByStudent = new Map<string, AdminStudentDirectorySection[]>();
  for (const raw of (enrollResult.data ?? []) as EnrollmentRow[]) {
    const studentId = String(raw.student_id);
    const sectionId = String(raw.section_id);
    const list = sectionsByStudent.get(studentId) ?? [];
    if (!list.some((s) => s.id === sectionId)) {
      const meta = sectionMetaFromEnrollment(raw);
      list.push({
        id: sectionId,
        name: meta.name,
        cohortId: meta.cohortId,
        discountPercent: percentByStudentSection.get(`${studentId}:${sectionId}`) ?? null,
      });
    }
    sectionsByStudent.set(studentId, list);
  }

  const rels = (relResult.data ?? []) as RelRow[];
  const tutorIds = [...new Set(rels.map((r) => String(r.tutor_id)).filter(Boolean))];
  const parentsByStudent = new Map<string, AdminStudentDirectoryParent[]>();

  if (tutorIds.length > 0) {
    const { data: profiles, error: profileError } = await admin
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", tutorIds);
    if (profileError) {
      logSupabaseClientError("loadAdminStudentDirectoryExtras:parent_profiles", profileError, {
        tutorCount: tutorIds.length,
      });
    }
    const profileById = new Map<string, ProfileRow>();
    for (const p of (profiles ?? []) as ProfileRow[]) {
      profileById.set(String(p.id), p);
    }
    for (const rel of rels) {
      const studentId = String(rel.student_id);
      const tutorId = String(rel.tutor_id);
      const profile = profileById.get(tutorId);
      const list = parentsByStudent.get(studentId) ?? [];
      if (!list.some((p) => p.id === tutorId)) {
        list.push({
          id: tutorId,
          firstName: profile?.first_name?.trim() ?? "",
          lastName: profile?.last_name?.trim() ?? "",
        });
      }
      parentsByStudent.set(studentId, list);
    }
  }

  const sectionIds = [...new Set([...sectionsByStudent.values()].flatMap((list) => list.map((s) => s.id)))];
  const monthlyDueByStudent = new Map<string, MonthlyDueTotal[]>();
  if (sectionIds.length > 0) {
    const [planResult, billingModes] = await Promise.all([
      admin
        .from("section_fee_plans")
        .select(
          "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
        )
        .in("section_id", sectionIds)
        .is("archived_at", null),
      loadSectionBillingModes(admin, sectionIds),
    ]);
    if (planResult.error) {
      logSupabaseClientError("loadAdminStudentDirectoryExtras:section_fee_plans", planResult.error, {
        sectionCount: sectionIds.length,
      });
    }
    const plansBySection = new Map<string, SectionFeePlan[]>();
    for (const row of (planResult.data ?? []) as SectionFeePlanRowDb[]) {
      const plan = mapSectionFeePlanRow(row);
      const list = plansBySection.get(plan.sectionId) ?? [];
      list.push(plan);
      plansBySection.set(plan.sectionId, list);
    }
    const year = refDate.getFullYear();
    const month = refDate.getMonth() + 1;
    for (const [studentId, sections] of sectionsByStudent) {
      const lines: MonthlyDueLine[] = sections.map((section) => {
        const skip = sectionIsClassPackBilled(billingModes.get(section.id) ?? null);
        const plan = skip
          ? null
          : resolveEffectiveSectionFeePlan(plansBySection.get(section.id) ?? [], year, month);
        return {
          skip,
          listAmount: plan?.monthlyFee ?? null,
          currency: plan?.currency ?? null,
          discountPercent: section.discountPercent,
        };
      });
      monthlyDueByStudent.set(studentId, sumDiscountedMonthlyDue(lines));
    }
  }

  return { sectionsByStudent, parentsByStudent, monthlyDueByStudent };
}
