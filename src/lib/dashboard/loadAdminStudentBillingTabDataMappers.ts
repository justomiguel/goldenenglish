import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import type { SectionScheduleSlot } from "@/types/academics";
import type { AdminBillingScholarship } from "@/types/adminStudentBilling";

export type AcademicSectionNested = {
  name: string;
  enrollment_fee_amount?: number | string | null;
  starts_on?: string | null;
  ends_on?: string | null;
  schedule_slots?: unknown;
  academic_cohorts?: { name?: string | null } | { name?: string | null }[] | null;
};

export type EnrollmentBenefitRow = {
  id: string;
  section_id: string;
  created_at: string | null;
  enrollment_fee_exempt: boolean | null;
  enrollment_exempt_reason: string | null;
  last_enrollment_paid_at: string | null;
  academic_sections: AcademicSectionNested | AcademicSectionNested[] | null;
};

export type ScholarshipBenefitRow = {
  id: string;
  enrollment_id: string;
  discount_percent: number | string;
  note: string | null;
  valid_from_year: number;
  valid_from_month: number;
  valid_until_year: number | null;
  valid_until_month: number | null;
  is_active: boolean;
};

export type EnrollmentReceiptRow = {
  id: string;
  enrollment_fee_receipt_url: string | null;
  enrollment_fee_receipt_status: string | null;
};

export function mapScholarship(row: ScholarshipBenefitRow): AdminBillingScholarship {
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

export function sectionNameFromEnrollment(row: EnrollmentBenefitRow): string {
  const section = Array.isArray(row.academic_sections)
    ? row.academic_sections[0]
    : row.academic_sections;
  return section?.name ?? row.section_id;
}

export function sectionEnrollmentMeta(row: EnrollmentBenefitRow): {
  sectionEnrollmentFeeAmount: number;
  sectionStartsOn: string;
  sectionEndsOn: string;
} {
  const sec = Array.isArray(row.academic_sections)
    ? row.academic_sections[0]
    : row.academic_sections;
  const rawAmt =
    sec && typeof sec === "object" && "enrollment_fee_amount" in sec
      ? (sec as { enrollment_fee_amount?: unknown }).enrollment_fee_amount
      : null;
  const n = rawAmt == null ? 0 : Number(rawAmt);
  const sectionEnrollmentFeeAmount = Number.isFinite(n) && n >= 0 ? n : 0;
  const startsRaw =
    sec && typeof sec === "object" && "starts_on" in sec
      ? (sec as { starts_on?: string | null }).starts_on
      : null;
  const endsRaw =
    sec && typeof sec === "object" && "ends_on" in sec
      ? (sec as { ends_on?: string | null }).ends_on
      : null;
  const starts = typeof startsRaw === "string" && startsRaw.length >= 10 ? startsRaw.slice(0, 10) : null;
  const ends = typeof endsRaw === "string" && endsRaw.length >= 10 ? endsRaw.slice(0, 10) : null;
  return {
    sectionEnrollmentFeeAmount,
    sectionStartsOn: starts ?? "1970-01-01",
    sectionEndsOn: ends ?? "2099-12-31",
  };
}

export function sectionScheduleSlotsAndCohort(row: EnrollmentBenefitRow): {
  scheduleSlots: SectionScheduleSlot[];
  cohortName: string;
} {
  const sec = Array.isArray(row.academic_sections)
    ? row.academic_sections[0]
    : row.academic_sections;
  const rawSlots = sec && typeof sec === "object" ? (sec as AcademicSectionNested).schedule_slots : null;
  const cohortRaw =
    sec && typeof sec === "object" ? (sec as AcademicSectionNested).academic_cohorts : null;
  const cohort = Array.isArray(cohortRaw) ? cohortRaw[0] : cohortRaw;
  const cohortName = cohort && typeof cohort === "object" && "name" in cohort ? String(cohort.name ?? "") : "";
  return {
    scheduleSlots: parseSectionScheduleSlots(rawSlots ?? []),
    cohortName,
  };
}
