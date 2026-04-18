import {
  buildSectionCollectionsView,
  type SectionCollectionsStudentInput,
} from "@/lib/billing/buildSectionCollectionsView";
import { mapSectionFeePlanRow } from "@/types/sectionFeePlan";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import {
  SECTION_COLLECTIONS_HEALTH_THRESHOLDS,
  type SectionCollectionsHealth,
  type SectionCollectionsKpis,
} from "@/types/sectionCollections";
import type { ScholarshipRow } from "@/lib/billing/scholarshipPeriod";
import type { StudentMonthlyPaymentRecord } from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import type {
  CohortCollectionsBulkRaw,
  CohortCollectionsBulkProfileRaw,
  CohortCollectionsBulkScholarshipRaw,
  CohortCollectionsMatrix,
  CohortCollectionsMatrixSection,
} from "@/types/cohortCollectionsMatrix";

export interface BuildCohortCollectionsMatrixOptions {
  todayYear: number;
  todayMonth: number;
}

function studentDisplayName(p: CohortCollectionsBulkProfileRaw): string {
  return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id;
}

function mapScholarship(
  row: CohortCollectionsBulkScholarshipRaw | undefined,
): ScholarshipRow | null {
  if (!row) return null;
  return {
    discount_percent: Number(row.discount_percent),
    valid_from_year: row.valid_from_year,
    valid_from_month: row.valid_from_month,
    valid_until_year: row.valid_until_year,
    valid_until_month: row.valid_until_month,
    is_active: Boolean(row.is_active),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function deriveOverallHealth(
  collectionRatio: number,
  overdueStudents: number,
  totalStudents: number,
  expectedYear: number,
): SectionCollectionsHealth {
  if (totalStudents === 0 || expectedYear === 0) return "watch";
  const t = SECTION_COLLECTIONS_HEALTH_THRESHOLDS;
  const overdueShare = overdueStudents / totalStudents;
  if (
    collectionRatio < t.criticalMaxRatio ||
    overdueShare >= t.watchOverdueShare
  ) {
    return "critical";
  }
  if (collectionRatio >= t.healthyMinRatio && overdueStudents === 0) {
    return "healthy";
  }
  return "watch";
}

function aggregateTotals(
  sections: readonly CohortCollectionsMatrixSection[],
): SectionCollectionsKpis {
  let paid = 0;
  let pendingReview = 0;
  let overdue = 0;
  let upcoming = 0;
  let expectedYear = 0;
  let totalStudents = 0;
  let overdueStudents = 0;
  for (const s of sections) {
    paid += s.view.kpis.paid;
    pendingReview += s.view.kpis.pendingReview;
    overdue += s.view.kpis.overdue;
    upcoming += s.view.kpis.upcoming;
    expectedYear += s.view.kpis.expectedYear;
    totalStudents += s.view.kpis.totalStudents;
    overdueStudents += s.view.kpis.overdueStudents;
  }
  const collectionRatio = expectedYear > 0 ? Math.min(1, paid / expectedYear) : 0;
  return {
    paid: round2(paid),
    pendingReview: round2(pendingReview),
    overdue: round2(overdue),
    upcoming: round2(upcoming),
    expectedYear: round2(expectedYear),
    collectionRatio: Math.round(collectionRatio * 1000) / 1000,
    totalStudents,
    overdueStudents,
    health: deriveOverallHealth(
      collectionRatio,
      overdueStudents,
      totalStudents,
      expectedYear,
    ),
  };
}

/**
 * Pure: compose the cohort collections matrix from the raw bulk RPC payload.
 *
 * Reuses `buildSectionCollectionsView` per section so the cells match the
 * existing student strip and the per-section matrix one-for-one. No I/O —
 * Supabase access happens at the loader boundary.
 */
export function buildCohortCollectionsMatrix(
  raw: CohortCollectionsBulkRaw,
  opts: BuildCohortCollectionsMatrixOptions,
): CohortCollectionsMatrix | null {
  if (!raw.cohort) return null;

  const profileById = new Map<string, CohortCollectionsBulkProfileRaw>();
  for (const p of raw.profiles) profileById.set(p.id, p);

  const scholarshipByStudent = new Map<
    string,
    CohortCollectionsBulkScholarshipRaw
  >();
  for (const sc of raw.scholarships) scholarshipByStudent.set(sc.student_id, sc);

  const enrollmentsBySection = new Map<
    string,
    Array<{ student_id: string; created_at: string | null }>
  >();
  for (const e of raw.enrollments) {
    const list = enrollmentsBySection.get(e.section_id) ?? [];
    list.push({ student_id: e.student_id, created_at: e.created_at });
    enrollmentsBySection.set(e.section_id, list);
  }

  const paymentsByStudentSection = new Map<
    string,
    StudentMonthlyPaymentRecord[]
  >();
  for (const p of raw.payments) {
    if (!p.section_id) continue;
    const key = `${p.section_id}::${p.student_id}`;
    const list = paymentsByStudentSection.get(key) ?? [];
    list.push({
      id: p.id,
      sectionId: p.section_id,
      month: Number(p.month),
      year: Number(p.year),
      amount: p.amount == null ? null : Number(p.amount),
      status: p.status,
      receiptSignedUrl: null,
    });
    paymentsByStudentSection.set(key, list);
  }

  const plansBySection = new Map<string, ReturnType<typeof mapSectionFeePlanRow>[]>();
  for (const planRow of raw.plans) {
    const list = plansBySection.get(planRow.section_id) ?? [];
    list.push(mapSectionFeePlanRow(planRow));
    plansBySection.set(planRow.section_id, list);
  }

  const matrixSections: CohortCollectionsMatrixSection[] = raw.sections.map(
    (sectionRow) => {
      const enrollments = enrollmentsBySection.get(sectionRow.id) ?? [];
      const students: SectionCollectionsStudentInput[] = enrollments.map((e) => {
        const profile = profileById.get(e.student_id) ?? {
          id: e.student_id,
          first_name: null,
          last_name: null,
          document_number: null,
        };
        return {
          studentId: e.student_id,
          studentName: studentDisplayName(profile),
          documentLabel: profile.document_number,
          scholarship: mapScholarship(scholarshipByStudent.get(e.student_id)),
          payments:
            paymentsByStudentSection.get(`${sectionRow.id}::${e.student_id}`) ??
            [],
          enrolledAt: e.created_at,
        };
      });

      const enrollmentFeeAmount = (() => {
        const raw = sectionRow.enrollment_fee_amount;
        if (raw == null) return 0;
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : 0;
      })();

      const view = buildSectionCollectionsView({
        sectionId: sectionRow.id,
        sectionName: sectionRow.name,
        cohortId: raw.cohort!.id,
        cohortName: raw.cohort!.name,
        todayYear: opts.todayYear,
        todayMonth: opts.todayMonth,
        plans: plansBySection.get(sectionRow.id) ?? [],
        students,
        sectionStartsOn: sectionRow.starts_on ?? "",
        sectionEndsOn: sectionRow.ends_on ?? "",
        sectionEnrollmentFeeAmount: enrollmentFeeAmount,
        scheduleSlots: parseSectionScheduleSlots(
          sectionRow.schedule_slots ?? [],
        ),
      });

      return { view, archivedAt: sectionRow.archived_at };
    },
  );

  return {
    cohortId: raw.cohort.id,
    cohortName: raw.cohort.name,
    year: raw.year,
    todayMonth: opts.todayMonth,
    sections: matrixSections,
    totals: aggregateTotals(matrixSections),
  };
}
