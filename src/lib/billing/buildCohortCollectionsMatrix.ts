import {
  buildSectionCollectionsView,
  type SectionCollectionsStudentInput,
} from "@/lib/billing/buildSectionCollectionsView";
import { mapSectionFeePlanRow } from "@/types/sectionFeePlan";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import type { ScholarshipRow } from "@/lib/billing/scholarshipPeriod";
import type { StudentMonthlyPaymentRecord } from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import { aggregateCohortCollectionsTotals } from "@/lib/billing/aggregateCohortCollectionsTotals";
import type {
  CohortCollectionsBulkRaw,
  CohortCollectionsBulkEnrollmentRaw,
  CohortCollectionsBulkProfileRaw,
  CohortCollectionsBulkScholarshipRaw,
  CohortCollectionsBulkStudentPromotionRaw,
  CohortCollectionsMatrix,
  CohortCollectionsMatrixSection,
} from "@/types/cohortCollectionsMatrix";
import { activePromotionLabel } from "@/lib/billing/studentPromotionStatus";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { EnrollmentFeeReceiptStatus } from "@/types/studentMonthlyPayments";

function normalizeEnrollmentReceiptStatus(
  raw: string | null | undefined,
): EnrollmentFeeReceiptStatus | null {
  if (raw === "pending" || raw === "approved" || raw === "rejected") return raw;
  return null;
}

export interface BuildCohortCollectionsMatrixOptions {
  todayYear: number;
  todayMonth: number;
}

function studentDisplayName(p: CohortCollectionsBulkProfileRaw): string {
  return formatProfileSnakeSurnameFirst(p, p.id);
}

function mapScholarship(
  row: CohortCollectionsBulkScholarshipRaw,
): ScholarshipRow {
  return {
    id: row.id,
    discount_percent: Number(row.discount_percent),
    note: row.note,
    valid_from_year: row.valid_from_year,
    valid_from_month: row.valid_from_month,
    valid_until_year: row.valid_until_year,
    valid_until_month: row.valid_until_month,
    is_active: Boolean(row.is_active),
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

  const scholarshipsByStudentSection = new Map<
    string,
    CohortCollectionsBulkScholarshipRaw[]
  >();
  for (const sc of raw.scholarships) {
    const key = `${sc.section_id}::${sc.student_id}`;
    const list = scholarshipsByStudentSection.get(key) ?? [];
    list.push(sc);
    scholarshipsByStudentSection.set(key, list);
  }

  const promotionsByStudent = new Map<
    string,
    CohortCollectionsBulkStudentPromotionRaw[]
  >();
  for (const promo of raw.promotions ?? []) {
    const list = promotionsByStudent.get(promo.student_id) ?? [];
    list.push(promo);
    promotionsByStudent.set(promo.student_id, list);
  }

  const enrollmentsBySection = new Map<
    string,
    CohortCollectionsBulkEnrollmentRaw[]
  >();
  for (const e of raw.enrollments) {
    const list = enrollmentsBySection.get(e.section_id) ?? [];
    list.push(e);
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
          dni_or_passport: null,
          enrollment_fee_exempt: null,
          enrollment_exempt_reason: null,
        };
        return {
          studentId: e.student_id,
          studentName: studentDisplayName(profile),
          documentLabel: profile.dni_or_passport,
          scholarships: (
            scholarshipsByStudentSection.get(`${sectionRow.id}::${e.student_id}`) ?? []
          ).map(mapScholarship),
          enrollmentFeeExempt:
            Boolean(e.enrollment_fee_exempt),
          enrollmentExemptReason:
            e.enrollment_exempt_reason ?? null,
          enrollmentId: e.id,
          enrollmentFeeReceiptStatus: normalizeEnrollmentReceiptStatus(
            e.enrollment_fee_receipt_status,
          ),
          enrollmentFeeReceiptSignedUrl: null,
          activePromotionLabel: activePromotionLabel(
            promotionsByStudent.get(e.student_id),
          ),
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
    totals: aggregateCohortCollectionsTotals(matrixSections),
  };
}
