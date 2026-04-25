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
} from "@/lib/billing/loadAdminSectionCollectionsViewQueries";

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
  for (const e of enrollments) enrolledAtByStudent.set(e.student_id, e.created_at);

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

  const [profiles, paymentsRes, scholarships] = await Promise.all([
    chunkedIn<ProfileRow>(
      supabase,
      "profiles",
      "id",
      studentIds,
      "id, first_name, last_name, dni_or_passport",
    ),
    supabase
      .from("payments")
      .select("id, student_id, section_id, month, year, amount, status, receipt_url")
      .eq("section_id", sectionId)
      .eq("year", opts.todayYear)
      .in("student_id", studentIds),
    chunkedIn<ScholarshipDbRow>(
      supabase,
      "student_scholarships",
      "student_id",
      studentIds,
      "student_id, discount_percent, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
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

  const scholarshipByStudent = new Map<string, ScholarshipDbRow>();
  for (const row of scholarships) {
    scholarshipByStudent.set(row.student_id, row);
  }

  const profileById = new Map<string, ProfileRow>();
  for (const p of profiles) profileById.set(p.id, p);

  const students: SectionCollectionsStudentInput[] = studentIds.map((id) => {
    const profile = profileById.get(id) ?? {
      id,
      first_name: null,
      last_name: null,
      dni_or_passport: null,
    };
    return {
      studentId: id,
      studentName: studentDisplayName(profile),
      documentLabel: profile.dni_or_passport,
      scholarship: mapScholarship(scholarshipByStudent.get(id)),
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
