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
import {
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";

interface LoadOptions {
  todayYear: number;
  todayMonth: number;
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
      "section_id, academic_sections(id, name, academic_cohorts(name))",
    )
    .eq("student_id", studentId)
    .eq("status", "active");

  type EnrollmentRow = {
    section_id: string;
    academic_sections:
      | {
          id: string;
          name: string;
          academic_cohorts: { name: string } | { name: string }[] | null;
        }
      | {
          id: string;
          name: string;
          academic_cohorts: { name: string } | { name: string }[] | null;
        }[]
      | null;
  };

  const sections = ((enrollments ?? []) as EnrollmentRow[]).map((row) => {
    const sec = Array.isArray(row.academic_sections)
      ? row.academic_sections[0]
      : row.academic_sections;
    const cohort = sec
      ? Array.isArray(sec.academic_cohorts)
        ? sec.academic_cohorts[0]
        : sec.academic_cohorts
      : null;
    return {
      sectionId: row.section_id,
      sectionName: sec?.name ?? "",
      cohortName: cohort?.name ?? "",
    };
  });

  const sectionIds = [...new Set(sections.map((s) => s.sectionId))];

  let plansBySection = new Map<string, SectionFeePlan[]>();
  if (sectionIds.length > 0) {
    const { data: planRows } = await supabase
      .from("section_fee_plans")
      .select(
        "id, section_id, effective_from_year, effective_from_month, monthly_fee, payments_count, charges_enrollment_fee, period_start_year, period_start_month, archived_at",
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
    }),
  );

  return {
    todayMonth: opts.todayMonth,
    todayYear: opts.todayYear,
    rows,
  };
}
