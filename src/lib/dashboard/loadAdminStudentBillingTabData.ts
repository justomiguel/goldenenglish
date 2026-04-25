import type { SupabaseClient } from "@supabase/supabase-js";
import { receiptSignedUrlForAdmin } from "@/lib/payments/receiptSignedUrl";
import type {
  AdminBillingScholarship,
  AdminStudentBillingTabData,
  AdminStudentBillingSectionBenefit,
} from "@/types/adminStudentBilling";

type EnrollmentBenefitRow = {
  id: string;
  section_id: string;
  enrollment_fee_exempt: boolean | null;
  enrollment_exempt_reason: string | null;
  last_enrollment_paid_at: string | null;
  academic_sections: { name: string } | { name: string }[] | null;
};

type ScholarshipBenefitRow = {
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

type EnrollmentReceiptRow = {
  id: string;
  enrollment_fee_receipt_url: string | null;
  enrollment_fee_receipt_status: string | null;
};

function mapScholarship(row: ScholarshipBenefitRow): AdminBillingScholarship {
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

function sectionName(row: EnrollmentBenefitRow): string {
  const section = Array.isArray(row.academic_sections)
    ? row.academic_sections[0]
    : row.academic_sections;
  return section?.name ?? row.section_id;
}

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
        "id, section_id, enrollment_fee_exempt, enrollment_exempt_reason, last_enrollment_paid_at, academic_sections(name)",
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

  const sectionBenefits: AdminStudentBillingSectionBenefit[] = enrollmentRowsWithUrls.map((row) => ({
    enrollmentId: row.id,
    sectionId: row.section_id,
    sectionName: sectionName(row),
    enrollmentFeeExempt: Boolean(row.enrollment_fee_exempt),
    enrollmentExemptReason: row.enrollment_exempt_reason,
    lastEnrollmentPaidAt: row.last_enrollment_paid_at,
    scholarships: scholarshipsByEnrollment.get(row.id) ?? [],
    enrollmentFeeReceiptSignedUrl: row.receiptSignedUrl,
    enrollmentFeeReceiptStatus: row.receiptStatus,
  }));
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
