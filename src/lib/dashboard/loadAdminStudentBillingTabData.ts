import type { SupabaseClient } from "@supabase/supabase-js";
import { receiptSignedUrlForAdmin } from "@/lib/payments/receiptSignedUrl";
import { resolveEffectiveSectionFeePlan } from "@/lib/billing/resolveEffectiveSectionFeePlan";
import type {
  AdminBillingScholarship,
  AdminStudentBillingTabData,
  AdminStudentBillingSectionBenefit,
} from "@/types/adminStudentBilling";
import {
  mapSectionFeePlanRow,
  type SectionFeePlan,
  type SectionFeePlanRowDb,
} from "@/types/sectionFeePlan";
import {
  type EnrollmentBenefitRow,
  type EnrollmentReceiptRow,
  type ScholarshipBenefitRow,
  mapScholarship,
  sectionEnrollmentMeta,
  sectionNameFromEnrollment,
  sectionScheduleSlotsAndCohort,
} from "@/lib/dashboard/loadAdminStudentBillingTabDataMappers";

export async function loadAdminStudentBillingTabData(
  supabase: SupabaseClient,
  studentId: string,
): Promise<AdminStudentBillingTabData | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, enrollment_fee_exempt, enrollment_exempt_reason, last_enrollment_paid_at")
    .eq("id", studentId)
    .single();

  if (!profile || profile.role !== "student") return null;

  const [{ data: payments }, { data: enrollments }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, month, year, amount, status, section_id, receipt_url, admin_notes, updated_at")
      .eq("student_id", studentId)
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
    supabase
      .from("section_enrollments")
      .select(
        "id, section_id, created_at, enrollment_fee_exempt, enrollment_exempt_reason, last_enrollment_paid_at, academic_sections(name, enrollment_fee_amount, starts_on, ends_on, schedule_slots, academic_cohorts(name))",
      )
      .eq("student_id", studentId)
      .eq("status", "active"),
  ]);

  const rows = await Promise.all(
    (payments ?? []).map(async (payment) => ({
      id: payment.id as string,
      month: payment.month as number,
      year: payment.year as number,
      amount: payment.amount != null ? Number(payment.amount) : null,
      status: payment.status as string,
      section_id: (payment.section_id as string | null) ?? null,
      admin_notes: (payment.admin_notes as string | null) ?? null,
      updated_at: payment.updated_at as string,
      receiptSignedUrl: payment.receipt_url
        ? await receiptSignedUrlForAdmin(payment.receipt_url as string)
        : null,
    })),
  );

  const enrollmentRows = (enrollments ?? []) as EnrollmentBenefitRow[];
  const enrollmentIds = enrollmentRows.map((row) => row.id);
  const { data: receiptRows } = enrollmentIds.length === 0
    ? { data: [] }
    : await supabase
        .from("section_enrollments")
        .select("id, enrollment_fee_receipt_url, enrollment_fee_receipt_status")
        .in("id", enrollmentIds);
  const receiptByEnrollment = new Map<string, EnrollmentReceiptRow>();
  for (const row of (receiptRows ?? []) as EnrollmentReceiptRow[]) {
    receiptByEnrollment.set(row.id, row);
  }

  const enrollmentRowsWithUrls = await Promise.all(
    enrollmentRows.map(async (row) => {
      const receipt = receiptByEnrollment.get(row.id) ?? null;
      const url = receipt?.enrollment_fee_receipt_url ?? null;
      const signedUrl = url ? await receiptSignedUrlForAdmin(url) : null;
      const rawStatus = receipt?.enrollment_fee_receipt_status ?? null;
      const receiptStatus: "pending" | "approved" | "rejected" | null =
        rawStatus === "pending" || rawStatus === "approved" || rawStatus === "rejected"
          ? rawStatus
          : null;
      return { ...row, receiptSignedUrl: signedUrl, receiptStatus };
    }),
  );

  const { data: scholarshipRows } = enrollmentIds.length === 0
    ? { data: [] }
    : await supabase
        .from("section_enrollment_scholarships")
        .select(
          "id, enrollment_id, discount_percent, note, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
        )
        .in("enrollment_id", enrollmentIds)
        .order("created_at", { ascending: true });
  const scholarshipsByEnrollment = new Map<string, AdminBillingScholarship[]>();
  for (const row of (scholarshipRows ?? []) as ScholarshipBenefitRow[]) {
    const list = scholarshipsByEnrollment.get(row.enrollment_id) ?? [];
    list.push(mapScholarship(row));
    scholarshipsByEnrollment.set(row.enrollment_id, list);
  }

  const uniqueSectionIds = [...new Set(enrollmentRowsWithUrls.map((r) => r.section_id))];
  const plansBySectionId = new Map<string, SectionFeePlan[]>();
  if (uniqueSectionIds.length > 0) {
    const { data: rawPlans } = await supabase
      .from("section_fee_plans")
      .select(
        "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
      )
      .in("section_id", uniqueSectionIds)
      .is("archived_at", null);
    for (const row of (rawPlans ?? []) as SectionFeePlanRowDb[]) {
      const p = mapSectionFeePlanRow(row);
      const arr = plansBySectionId.get(p.sectionId) ?? [];
      arr.push(p);
      plansBySectionId.set(p.sectionId, arr);
    }
  }
  const refNow = new Date();
  const refYear = refNow.getFullYear();
  const refMonth = refNow.getMonth() + 1;

  const sectionBenefits: AdminStudentBillingSectionBenefit[] = enrollmentRowsWithUrls.map((row) => {
    const meta = sectionEnrollmentMeta(row);
    const plans = plansBySectionId.get(row.section_id) ?? [];
    const eff = resolveEffectiveSectionFeePlan(plans, refYear, refMonth);
    const slotsAndCohort = sectionScheduleSlotsAndCohort(row);
    return {
      enrollmentId: row.id,
      sectionId: row.section_id,
      sectionName: sectionNameFromEnrollment(row),
      ...meta,
      sectionMonthlyFeeAmount: eff?.monthlyFee ?? null,
      sectionMonthlyFeeCurrency: eff?.currency ?? null,
      enrollmentCreatedAt: row.created_at ?? null,
      enrollmentFeeExempt: Boolean(row.enrollment_fee_exempt),
      enrollmentExemptReason: row.enrollment_exempt_reason,
      lastEnrollmentPaidAt: row.last_enrollment_paid_at,
      scholarships: scholarshipsByEnrollment.get(row.id) ?? [],
      enrollmentFeeReceiptSignedUrl: row.receiptSignedUrl,
      enrollmentFeeReceiptStatus: row.receiptStatus,
      feePlans: plans,
      scheduleSlots: slotsAndCohort.scheduleSlots,
      cohortName: slotsAndCohort.cohortName,
    };
  });
  const firstSectionBenefit = sectionBenefits[0] ?? null;

  return {
    payments: rows,
    scholarships: firstSectionBenefit ? firstSectionBenefit.scholarships : [],
    sectionBenefits,
    enrollmentFeeExempt:
      firstSectionBenefit ? firstSectionBenefit.enrollmentFeeExempt : Boolean(profile.enrollment_fee_exempt),
    enrollmentExemptReason:
      firstSectionBenefit
        ? firstSectionBenefit.enrollmentExemptReason
        : ((profile.enrollment_exempt_reason as string | null) ?? null),
    lastEnrollmentPaidAt:
      firstSectionBenefit
        ? firstSectionBenefit.lastEnrollmentPaidAt
        : ((profile.last_enrollment_paid_at as string | null) ?? null),
  };
}
