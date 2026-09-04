import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseOptionalFeeAmount,
  resolveEffectiveEnrollmentFeeAmount,
  resolveEffectiveMonthlyFee,
} from "@/lib/billing/resolveCohortFeeDefaults";
import { resolveEffectiveSectionFeePlan } from "@/lib/billing/resolveEffectiveSectionFeePlan";
import { mapSectionFeePlanRow, type SectionFeePlanRowDb } from "@/types/sectionFeePlan";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";
import {
  firstClassPackTuition,
  type FirstClassPackTuition,
} from "@/lib/billing/firstClassPackTuition";
import { sectionIsClassPackBilled } from "@/lib/billing/sectionBillingMode";
import { mapClassPackPriceRow, type ClassPackPriceRowDb } from "@/types/classPack";
import { resolveExistingStudentByDni } from "@/lib/register/resolveExistingStudentByDni";
import { getInstituteTimeZone } from "@/lib/datetime/instituteTimeZone";
import { instituteCalendarPartsInTimeZone } from "@/lib/datetime/instituteCalendarMonthRange";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { pickJoinPackageMonth } from "@/lib/register/pickJoinPackageMonth";
import { sectionHasRemainingClassThisMonth } from "@/lib/register/sectionHasRemainingClassThisMonth";

export async function loadTrialConvertQuoteFacts(
  admin: SupabaseClient,
  input: { dni: string; sectionIds: string[]; now?: Date },
): Promise<{
  enrollmentAmounts: Record<string, number>;
  monthlyAmounts: Record<string, number>;
  alreadyPaidEnrollmentIds: string[];
  alreadyPaidMonthIds: string[];
  currency: string;
  openBySectionId: Record<string, boolean>;
  classPack: FirstClassPackTuition | null;
  periodYear: number;
  periodMonth: number;
  tuitionMonths: Record<string, { year: number; month: number }>;
}> {
  const ids = [...new Set(input.sectionIds.filter(Boolean))];
  const enrollmentAmounts: Record<string, number> = {};
  const monthlyAmounts: Record<string, number> = {};
  const tuitionMonths: Record<string, { year: number; month: number }> = {};
  const openBySectionId: Record<string, boolean> = {};
  let currency = "USD";
  const now = input.now ?? new Date();
  const { y, m } = instituteCalendarPartsInTimeZone(now, getInstituteTimeZone());
  if (ids.length === 0) {
    return {
      enrollmentAmounts,
      monthlyAmounts,
      alreadyPaidEnrollmentIds: [],
      alreadyPaidMonthIds: [],
      currency,
      openBySectionId,
      classPack: null,
      periodYear: y,
      periodMonth: m,
      tuitionMonths: {},
    };
  }

  const [{ data: sections }, { data: plans }, { data: packRows }] = await Promise.all([
    admin
      .from("academic_sections")
      .select(
        "id, enrollment_fee_amount, billing_mode, starts_on, ends_on, schedule_slots, academic_cohorts(default_enrollment_fee_amount, default_monthly_fee)",
      )
      .in("id", ids),
    admin
      .from("section_fee_plans")
      .select(
        "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
      )
      .is("archived_at", null)
      .in("section_id", ids),
    admin
      .from("class_pack_prices")
      .select(
        "id, effective_from_year, effective_from_month, class_count, amount, currency, archived_at",
      )
      .is("archived_at", null),
  ]);

  const plansBySection = new Map<string, SectionFeePlanRowDb[]>();
  for (const row of (plans ?? []) as SectionFeePlanRowDb[]) {
    const list = plansBySection.get(row.section_id) ?? [];
    list.push(row);
    plansBySection.set(row.section_id, list);
  }

  for (const raw of sections ?? []) {
    const row = raw as Record<string, unknown>;
    const id = String(row.id);
    const cohortRel = row.academic_cohorts;
    const cohort = Array.isArray(cohortRel) ? cohortRel[0] : cohortRel;
    const cohortObj = (cohort ?? {}) as Record<string, unknown>;
    enrollmentAmounts[id] = resolveEffectiveEnrollmentFeeAmount(
      parseOptionalFeeAmount(row.enrollment_fee_amount),
      parseOptionalFeeAmount(cohortObj.default_enrollment_fee_amount),
    );
    const mapped = (plansBySection.get(id) ?? []).map(mapSectionFeePlanRow);
    const startsOn = row.starts_on != null ? String(row.starts_on).slice(0, 10) : null;
    const endsOn = row.ends_on != null ? String(row.ends_on).slice(0, 10) : null;
    const picked = sectionIsClassPackBilled(row.billing_mode)
      ? { year: y, month: m }
      : pickJoinPackageMonth({
          hasRemainingClassThisMonth: sectionHasRemainingClassThisMonth({
            slots: parseSectionScheduleSlots(row.schedule_slots),
            startsOn,
            endsOn,
            now,
            timeZone: getInstituteTimeZone(),
          }),
          sectionStartsOn: startsOn,
          sectionEndsOn: endsOn,
          now,
          timeZone: getInstituteTimeZone(),
        });
    if (picked) tuitionMonths[id] = picked;
    const planYear = picked?.year ?? y;
    const planMonth = picked?.month ?? m;
    const sectionPlan = resolveEffectiveSectionFeePlan(mapped, planYear, planMonth);
    const monthly = resolveEffectiveMonthlyFee({
      billingMode: typeof row.billing_mode === "string" ? row.billing_mode : null,
      sectionPlan: sectionPlan
        ? { monthlyFee: sectionPlan.monthlyFee, currency: sectionPlan.currency }
        : null,
      cohortDefaultMonthlyFee: parseOptionalFeeAmount(cohortObj.default_monthly_fee),
    });
    monthlyAmounts[id] =
      !picked && !sectionIsClassPackBilled(row.billing_mode)
        ? 0
        : monthly.kind === "section" || monthly.kind === "cohort"
          ? monthly.monthlyFee
          : 0;
    if ((monthly.kind === "section" || monthly.kind === "cohort") && monthly.currency) {
      currency = monthly.currency;
    }
    openBySectionId[id] = await requestedSectionsHaveOpenSeats(admin, [id]);
  }

  const classPackIds = (sections ?? [])
    .map((raw) => raw as Record<string, unknown>)
    .filter((row) => sectionIsClassPackBilled(row.billing_mode))
    .map((row) => String(row.id));
  const classPack = firstClassPackTuition(
    ((packRows ?? []) as ClassPackPriceRowDb[]).map(mapClassPackPriceRow),
    y,
    m,
  );
  if (classPack && classPackIds[0] && monthlyAmounts[classPackIds[0]] === 0) {
    monthlyAmounts[classPackIds[0]] = classPack.amount;
    currency = classPack.currency;
  }

  const identity = await resolveExistingStudentByDni(admin, input.dni);
  const alreadyPaidEnrollmentIds: string[] = [];
  const alreadyPaidMonthIds: string[] = [];
  if (identity.kind === "student") {
    const { data: enrolls } = await admin
      .from("section_enrollments")
      .select("section_id, last_enrollment_paid_at, enrollment_fee_exempt")
      .eq("student_id", identity.studentId)
      .in("section_id", ids);
    for (const row of enrolls ?? []) {
      const id = String(row.section_id);
      if (row.enrollment_fee_exempt || row.last_enrollment_paid_at) {
        alreadyPaidEnrollmentIds.push(id);
      }
    }
    const { data: pays } = await admin
      .from("payments")
      .select("section_id, year, month, status")
      .eq("student_id", identity.studentId)
      .in("section_id", ids)
      .eq("status", "approved");
    for (const row of pays ?? []) {
      const id = String(row.section_id);
      const due = tuitionMonths[id] ?? { year: y, month: m };
      if (Number(row.year) === due.year && Number(row.month) === due.month) {
        alreadyPaidMonthIds.push(id);
      }
    }
    if (classPack && classPackIds.length > 0) {
      const { data: packs } = await admin
        .from("student_class_packs")
        .select("id")
        .eq("student_id", identity.studentId)
        .eq("year", y)
        .eq("month", m)
        .in("status", ["approved", "exempt"])
        .limit(1);
      if ((packs ?? []).length > 0) {
        for (const id of classPackIds) alreadyPaidMonthIds.push(id);
      }
    }
  }

  return {
    enrollmentAmounts,
    monthlyAmounts,
    alreadyPaidEnrollmentIds,
    alreadyPaidMonthIds,
    currency,
    openBySectionId,
    classPack:
      classPack &&
      classPackIds.length > 0 &&
      !classPackIds.some((id) => alreadyPaidMonthIds.includes(id))
        ? classPack
        : null,
    periodYear: y,
    periodMonth: m,
    tuitionMonths,
  };
}
