import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildSectionCollectionsView,
  type SectionCollectionsStudentInput,
} from "@/lib/billing/buildSectionCollectionsView";
import type { StudentMonthlyPaymentRecord } from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import {
  loadActiveEnrollments,
  loadActivePlans,
  loadSectionMeta,
  mapScholarship,
  studentDisplayName,
  type PaymentRow,
  type ProfileRow,
  type ScholarshipDbRow,
  type SectionMeta,
  type StudentPromotionDbRow,
} from "@/lib/billing/loadAdminSectionCollectionsViewQueries";
import { activePromotionLabel } from "@/lib/billing/studentPromotionStatus";

export interface LoadAdminSectionCollectionsOptions {
  todayYear: number;
  todayMonth: number;
}

/**
 * Bounded loader: only reads rows for one section + one calendar year. The
 * number of rows scales with the number of active students in that section
 * (decenas por sección por diseño de negocio).
 */
export async function loadAdminSectionCollectionsView(
  supabase: SupabaseClient,
  sectionId: string,
  opts: LoadAdminSectionCollectionsOptions,
): Promise<SectionCollectionsView | null> {
  const meta = await loadSectionMeta(supabase, sectionId);
  if (!meta) return null;

  const [enrollments, plans] = await Promise.all([
    loadActiveEnrollments(supabase, sectionId),
    loadActivePlans(supabase, sectionId),
  ]);
  const studentIds = enrollments.map((e) => e.student_id);
  const enrolledAtByStudent = new Map<string, string | null>();
  const enrollmentByStudent = new Map<string, (typeof enrollments)[number]>();
  for (const e of enrollments) {
    enrolledAtByStudent.set(e.student_id, e.created_at);
    enrollmentByStudent.set(e.student_id, e);
  }

  if (studentIds.length === 0) {
    return buildSectionCollectionsView({
      sectionId: meta.id,
      sectionName: meta.name,
      cohortId: meta.cohortId,
      cohortName: meta.cohortName,
      todayYear: opts.todayYear,
      todayMonth: opts.todayMonth,
      plans,
      students: [],
      sectionStartsOn: meta.startsOn,
      sectionEndsOn: meta.endsOn,
      scheduleSlots: meta.scheduleSlots,
      sectionEnrollmentFeeAmount: meta.enrollmentFeeAmount,
    });
  }

  const [profiles, paymentsRes, scholarshipsRes, promotions] = await Promise.all([
    chunkedIn<ProfileRow>(
      supabase,
      "profiles",
      "id",
      studentIds,
      "id, first_name, last_name, dni_or_passport, enrollment_fee_exempt, enrollment_exempt_reason",
    ),
    supabase
      .from("payments")
      .select("id, student_id, section_id, month, year, amount, status, receipt_url")
      .eq("section_id", sectionId)
      .eq("year", opts.todayYear)
      .in("student_id", studentIds),
    supabase
      .from("section_enrollment_scholarships")
      .select(
        "id, enrollment_id, student_id, discount_percent, note, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
      )
      .eq("section_id", sectionId),
    chunkedIn<StudentPromotionDbRow>(
      supabase,
      "student_promotions",
      "student_id",
      studentIds,
      "student_id, code_snapshot, promotion_snapshot, applies_to_snapshot, monthly_months_remaining, enrollment_consumed, applied_at",
    ),
  ]);

  const paymentsByStudent = new Map<string, StudentMonthlyPaymentRecord[]>();
  for (const raw of (paymentsRes.data ?? []) as PaymentRow[]) {
    const list = paymentsByStudent.get(raw.student_id) ?? [];
    list.push({
      id: raw.id,
      sectionId: raw.section_id,
      month: Number(raw.month),
      year: Number(raw.year),
      amount: raw.amount == null ? null : Number(raw.amount),
      status: raw.status,
      receiptSignedUrl: null,
    });
    paymentsByStudent.set(raw.student_id, list);
  }

  const scholarshipsByStudent = new Map<string, ScholarshipDbRow[]>();
  for (const row of (scholarshipsRes.data ?? []) as ScholarshipDbRow[]) {
    const list = scholarshipsByStudent.get(row.student_id) ?? [];
    list.push(row);
    scholarshipsByStudent.set(row.student_id, list);
  }

  const promotionsByStudent = new Map<string, StudentPromotionDbRow[]>();
  for (const row of promotions) {
    const list = promotionsByStudent.get(row.student_id) ?? [];
    list.push(row);
    promotionsByStudent.set(row.student_id, list);
  }

  const profileById = new Map<string, ProfileRow>();
  for (const p of profiles) profileById.set(p.id, p);

  const students: SectionCollectionsStudentInput[] = studentIds.map((id) => {
    const profile = profileById.get(id) ?? {
      id,
      first_name: null,
      last_name: null,
      dni_or_passport: null,
      enrollment_fee_exempt: null,
      enrollment_exempt_reason: null,
    };
    const enrollment = enrollmentByStudent.get(id) ?? null;
    return {
      studentId: id,
      studentName: studentDisplayName(profile),
      documentLabel: profile.dni_or_passport,
      scholarships: (scholarshipsByStudent.get(id) ?? []).map(mapScholarship),
      enrollmentFeeExempt:
        enrollment
          ? Boolean(enrollment.enrollment_fee_exempt)
          : Boolean(profile.enrollment_fee_exempt),
      enrollmentExemptReason:
        enrollment
          ? enrollment.enrollment_exempt_reason
          : profile.enrollment_exempt_reason,
      activePromotionLabel: activePromotionLabel(promotionsByStudent.get(id)),
      payments: paymentsByStudent.get(id) ?? [],
      enrolledAt: enrolledAtByStudent.get(id) ?? null,
    };
  });

  return buildSectionCollectionsView({
    sectionId: meta.id,
    sectionName: meta.name,
    cohortId: meta.cohortId,
    cohortName: meta.cohortName,
    todayYear: opts.todayYear,
    todayMonth: opts.todayMonth,
    plans,
    students,
    sectionStartsOn: meta.startsOn,
    sectionEndsOn: meta.endsOn,
    scheduleSlots: meta.scheduleSlots,
    sectionEnrollmentFeeAmount: meta.enrollmentFeeAmount,
  });
}

export type { SectionMeta as LoadedSectionMeta };
