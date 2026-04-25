import type { SupabaseClient } from "@supabase/supabase-js";
import {
  effectiveAmountAfterScholarship,
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";
import { resolveEffectiveSectionFeePlan } from "@/lib/billing/resolveEffectiveSectionFeePlan";
import {
  mapSectionFeePlanRow,
  type SectionFeePlanRowDb,
} from "@/types/sectionFeePlan";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import {
  countSectionMonthlyClasses,
  intersectDateRange,
  monthBounds,
} from "@/lib/billing/countSectionMonthlyClasses";
import { prorateMonthlyFee } from "@/lib/billing/prorateMonthlyFee";

export type SectionPlanAmountResult =
  | {
      code: "ok";
      amount: number;
      currency: string;
      proration: { numerator: number; denominator: number; full: boolean };
    }
  | { code: "no_plan" }
  | { code: "out_of_period" };

export async function isStudentActivelyEnrolledInSection(
  supabase: SupabaseClient,
  studentId: string,
  sectionId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("section_enrollments")
    .select("id")
    .eq("section_id", sectionId)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

function parseUtcDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const trimmed = iso.length >= 10 ? iso.slice(0, 10) : iso;
  const [y, m, d] = trimmed.split("-").map((n) => Number(n));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Server-side: resolves the monthly amount the student must pay for a given
 * (sectionId, year, month), applying the section's effective plan, monthly
 * proration based on available classes for that student, and any active
 * student scholarship.
 */
export async function resolveSectionPlanMonthlyAmount(
  supabase: SupabaseClient,
  studentId: string,
  sectionId: string,
  year: number,
  month: number,
): Promise<SectionPlanAmountResult> {
  const { data: planRows } = await supabase
    .from("section_fee_plans")
    .select(
      "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
    )
    .is("archived_at", null)
    .eq("section_id", sectionId);
  const plans = ((planRows ?? []) as SectionFeePlanRowDb[]).map(mapSectionFeePlanRow);
  const plan = resolveEffectiveSectionFeePlan(plans, year, month);
  if (!plan) return { code: "no_plan" };

  const { data: secRow } = await supabase
    .from("academic_sections")
    .select("starts_on, ends_on, schedule_slots")
    .eq("id", sectionId)
    .maybeSingle();
  const sec = secRow as
    | { starts_on: string | null; ends_on: string | null; schedule_slots: unknown }
    | null;
  const sectionFrom = parseUtcDate(sec?.starts_on ?? null);
  const sectionUntil = parseUtcDate(sec?.ends_on ?? null);
  const sectionRange =
    sectionFrom && sectionUntil && sectionFrom.getTime() <= sectionUntil.getTime()
      ? { from: sectionFrom, until: sectionUntil }
      : null;
  const scheduleSlots = parseSectionScheduleSlots(sec?.schedule_slots ?? []);

  const { data: enrolment } = await supabase
    .from("section_enrollments")
    .select("id, created_at")
    .eq("section_id", sectionId)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  type EnrollmentRow = {
    id: string;
    created_at: string | null;
  };
  const enrollmentRow = enrolment as EnrollmentRow | null;
  const enrolledAt = parseUtcDate(enrollmentRow?.created_at ?? null);

  const monthRange = monthBounds(year, month);
  const sectionInMonth = sectionRange ? intersectDateRange(sectionRange, monthRange) : null;
  const totalClasses = sectionInMonth
    ? countSectionMonthlyClasses({
        scheduleSlots,
        from: sectionInMonth.from,
        until: sectionInMonth.until,
      })
    : 0;
  const studentRange = enrolledAt && sectionInMonth
    ? intersectDateRange(sectionInMonth, { from: enrolledAt, until: monthRange.until })
    : sectionInMonth;
  const availableClasses = studentRange
    ? countSectionMonthlyClasses({
        scheduleSlots,
        from: studentRange.from,
        until: studentRange.until,
      })
    : 0;

  const prorated = prorateMonthlyFee({
    monthlyFee: plan.monthlyFee,
    totalClassesInMonth: totalClasses,
    availableClassesForStudent: availableClasses,
  });
  if (prorated.code !== "ok") return { code: "out_of_period" };

  const { data: scholarshipRows } = enrollmentRow?.id
    ? await supabase
        .from("section_enrollment_scholarships")
        .select(
          "id, discount_percent, note, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
        )
        .eq("enrollment_id", enrollmentRow.id)
    : { data: [] };
  const scholarships: ScholarshipRow[] = ((scholarshipRows ?? []) as Array<ScholarshipRow>).map((row) => ({
    id: row.id,
    discount_percent: Number(row.discount_percent),
    note: row.note ?? null,
    valid_from_year: row.valid_from_year,
    valid_from_month: row.valid_from_month,
    valid_until_year: row.valid_until_year,
    valid_until_month: row.valid_until_month,
    is_active: Boolean(row.is_active),
  }));

  const adjusted = effectiveAmountAfterScholarship(
    prorated.amount,
    year,
    month,
    scholarships,
  );
  return {
    code: "ok",
    amount: adjusted ?? prorated.amount,
    currency: plan.currency,
    proration: {
      numerator: prorated.numerator,
      denominator: prorated.denominator,
      full: prorated.full,
    },
  };
}
