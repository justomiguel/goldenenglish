import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapSectionFeePlanRow,
  type SectionFeePlan,
  type SectionFeePlanRowDb,
} from "@/types/sectionFeePlan";
import type {
  StudentMonthlyPaymentsView,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";
import {
  buildStudentMonthlyPaymentsRow,
  type StudentMonthlyPaymentRecord,
} from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import { studentReceiptSignedUrl } from "@/lib/payments/studentReceiptSignedUrl";
import { type ScholarshipRow } from "@/lib/billing/scholarshipPeriod";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import type { SectionScheduleSlot } from "@/types/academics";

interface LoadOptions {
  todayYear: number;
  todayMonth: number;
}

interface SectionMeta {
  sectionId: string;
  sectionName: string;
  cohortName: string;
  startsOn: string;
  endsOn: string;
  scheduleSlots: SectionScheduleSlot[];
  enrolledAt: string | null;
  enrollmentFeeAmount: number;
}

/**
 * Loads the data needed to render the student monthly payments strip:
 * one row per active section with its 12-month cells.
 */
export async function loadStudentMonthlyPaymentsView(
  supabase: SupabaseClient,
  studentId: string,
  scholarship: ScholarshipRow | null,
  opts: LoadOptions,
): Promise<StudentMonthlyPaymentsView> {
  const { data: enrollments } = await supabase
    .from("section_enrollments")
    .select(
      "section_id, created_at, academic_sections(id, name, starts_on, ends_on, schedule_slots, enrollment_fee_amount, academic_cohorts(name))",
    )
    .eq("student_id", studentId)
    .eq("status", "active");

  type EnrollmentRow = {
    section_id: string;
    created_at: string | null;
    academic_sections:
      | EnrollmentSectionRow
      | EnrollmentSectionRow[]
      | null;
  };
  type EnrollmentSectionRow = {
    id: string;
    name: string;
    starts_on: string | null;
    ends_on: string | null;
    schedule_slots: unknown;
    enrollment_fee_amount: number | string | null;
    academic_cohorts: { name: string } | { name: string }[] | null;
  };

  const sections: SectionMeta[] = ((enrollments ?? []) as EnrollmentRow[]).map((row) => {
    const sec = Array.isArray(row.academic_sections)
      ? row.academic_sections[0]
      : row.academic_sections;
    const cohort = sec
      ? Array.isArray(sec.academic_cohorts)
        ? sec.academic_cohorts[0]
        : sec.academic_cohorts
      : null;
    const rawEnrollment = sec?.enrollment_fee_amount == null ? 0 : Number(sec.enrollment_fee_amount);
    return {
      sectionId: row.section_id,
      sectionName: sec?.name ?? "",
      cohortName: cohort?.name ?? "",
      startsOn: sec?.starts_on ?? "",
      endsOn: sec?.ends_on ?? "",
      scheduleSlots: parseSectionScheduleSlots(sec?.schedule_slots ?? []),
      enrolledAt: row.created_at ?? null,
      enrollmentFeeAmount:
        Number.isFinite(rawEnrollment) && rawEnrollment >= 0 ? rawEnrollment : 0,
    };
  });

  const sectionIds = [...new Set(sections.map((s) => s.sectionId))];

  let plansBySection = new Map<string, SectionFeePlan[]>();
  if (sectionIds.length > 0) {
    const { data: planRows } = await supabase
      .from("section_fee_plans")
      .select(
        "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
      )
      .is("archived_at", null)
      .in("section_id", sectionIds);
    plansBySection = ((planRows ?? []) as SectionFeePlanRowDb[]).reduce(
      (acc, raw) => {
        const plan = mapSectionFeePlanRow(raw);
        const list = acc.get(plan.sectionId) ?? [];
        list.push(plan);
        acc.set(plan.sectionId, list);
        return acc;
      },
      new Map<string, SectionFeePlan[]>(),
    );
  }

  type PaymentRow = {
    id: string;
    section_id: string | null;
    month: number;
    year: number;
    amount: number | string | null;
    status: StudentMonthlyPaymentRecord["status"];
    receipt_url: string | null;
  };

  const paymentsBySection = new Map<string | null, StudentMonthlyPaymentRecord[]>();
  if (sectionIds.length > 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("id, section_id, month, year, amount, status, receipt_url")
      .eq("student_id", studentId)
      .eq("year", opts.todayYear)
      .in("section_id", sectionIds);
    const records: StudentMonthlyPaymentRecord[] = await Promise.all(
      ((payments ?? []) as PaymentRow[]).map(async (p) => ({
        id: p.id,
        sectionId: p.section_id,
        month: Number(p.month),
        year: Number(p.year),
        amount: p.amount == null ? null : Number(p.amount),
        status: p.status,
        receiptSignedUrl: await studentReceiptSignedUrl(supabase, studentId, p.receipt_url),
      })),
    );
    for (const rec of records) {
      const list = paymentsBySection.get(rec.sectionId) ?? [];
      list.push(rec);
      paymentsBySection.set(rec.sectionId, list);
    }
  }

  const rows: StudentMonthlyPaymentSectionRow[] = sections.map((s) =>
    buildStudentMonthlyPaymentsRow({
      sectionId: s.sectionId,
      sectionName: s.sectionName,
      cohortName: s.cohortName,
      plans: plansBySection.get(s.sectionId) ?? [],
      payments: paymentsBySection.get(s.sectionId) ?? [],
      scholarship,
      todayYear: opts.todayYear,
      todayMonth: opts.todayMonth,
      sectionStartsOn: s.startsOn,
      sectionEndsOn: s.endsOn,
      studentEnrolledAt: s.enrolledAt,
      scheduleSlots: s.scheduleSlots,
      sectionEnrollmentFeeAmount: s.enrollmentFeeAmount,
    }),
  );

  return {
    todayMonth: opts.todayMonth,
    todayYear: opts.todayYear,
    rows,
  };
}
