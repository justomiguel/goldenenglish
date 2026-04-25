import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  effectiveAmountAfterScholarship,
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";
import { loadStudentMonthlyPaymentsView } from "@/lib/billing/loadStudentMonthlyPaymentsView";
import { StudentPaymentsEntry } from "@/components/student/StudentPaymentsEntry";
import type { StudentPaymentRow } from "@/components/student/StudentPaymentsHistory";
import { studentReceiptSignedUrl } from "@/lib/payments/studentReceiptSignedUrl";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import {
  submitStudentPaymentReceipt,
  submitEnrollmentFeeReceipt,
} from "@/app/[locale]/dashboard/student/payments/actions";
import type { Locale } from "@/types/i18n";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentPaymentsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") redirect(`/${locale}/dashboard`);

  const perms = await getProfilePermissions(supabase, user.id);
  const paymentsBlockedMessage =
    perms && !perms.canAccessPaymentsModule
      ? dict.dashboard.student.tutorManagesPayments
      : undefined;

  if (paymentsBlockedMessage) {
    return (
      <StudentPaymentsEntry
        locale={locale as Locale}
        studentId={user.id}
        hasPromotionApplied={false}
        title={dict.dashboard.student.paymentsTitle}
        lead={dict.dashboard.student.paymentsLead}
        payments={[]}
        monthlyView={null}
        labels={dict.dashboard.student}
        paymentsBlockedMessage={paymentsBlockedMessage}
        submitReceiptAction={submitStudentPaymentReceipt}
        submitEnrollmentFeeReceiptAction={submitEnrollmentFeeReceipt}
      />
    );
  }

  const { data: scholarshipData } = await supabase
    .from("section_enrollment_scholarships")
    .select(
      "id, section_id, discount_percent, note, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
    )
    .eq("student_id", user.id);
  const scholarshipsBySection = new Map<string, ScholarshipRow[]>();
  for (const row of (scholarshipData ?? []) as Array<ScholarshipRow & { section_id: string }>) {
    const list = scholarshipsBySection.get(row.section_id) ?? [];
    list.push({
      id: row.id,
      discount_percent: Number(row.discount_percent),
      note: row.note ?? null,
      valid_from_year: row.valid_from_year,
      valid_from_month: row.valid_from_month,
      valid_until_year: row.valid_until_year,
      valid_until_month: row.valid_until_month,
      is_active: Boolean(row.is_active),
    });
    scholarshipsBySection.set(row.section_id, list);
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("id, section_id, month, year, amount, status, receipt_url, updated_at")
    .eq("student_id", user.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  let promoCount = 0;
  const promoRes = await supabase
    .from("student_promotions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", user.id);
  if (!promoRes.error) promoCount = promoRes.count ?? 0;

  const today = new Date();
  const monthlyView = await loadStudentMonthlyPaymentsView(
    supabase,
    user.id,
    [],
    { todayYear: today.getFullYear(), todayMonth: today.getMonth() + 1 },
  );
  const fullMonthAmountByPaymentSlot = new Map<string, number>();
  for (const section of monthlyView.rows) {
    for (const cell of section.cells) {
      if (cell.fullMonthExpectedAmount == null) continue;
      fullMonthAmountByPaymentSlot.set(
        `${section.sectionId}:${cell.year}:${cell.month}`,
        cell.fullMonthExpectedAmount,
      );
    }
  }

  const rows: StudentPaymentRow[] = await Promise.all(
    (payments ?? []).map(async (p) => {
      const amount = p.amount != null ? Number(p.amount) : null;
      const st = p.status as StudentPaymentRow["status"];
      const url = await studentReceiptSignedUrl(
        supabase,
        user.id,
        p.receipt_url as string | null,
      );
      const y = p.year as number;
      const mo = p.month as number;
      const scholarships = p.section_id
        ? scholarshipsBySection.get(p.section_id as string) ?? []
        : [];
      const fullMonthDisplayAmount = p.section_id
        ? fullMonthAmountByPaymentSlot.get(`${p.section_id as string}:${y}:${mo}`) ?? null
        : null;
      const displayAmount =
        fullMonthDisplayAmount ??
        (st === "exempt"
          ? amount
          : effectiveAmountAfterScholarship(amount, y, mo, scholarships));
      return {
        id: p.id as string,
        month: mo,
        year: y,
        amount,
        displayAmount,
        status: st,
        updated_at: p.updated_at as string,
        receiptSignedUrl: url,
      };
    }),
  );

  return (
    <StudentPaymentsEntry
      locale={locale as Locale}
      studentId={user.id}
      hasPromotionApplied={promoCount > 0}
      title={dict.dashboard.student.paymentsTitle}
      lead={dict.dashboard.student.paymentsLead}
      payments={rows}
      monthlyView={monthlyView}
      labels={dict.dashboard.student}
      paymentsBlockedMessage={paymentsBlockedMessage}
      submitReceiptAction={submitStudentPaymentReceipt}
      submitEnrollmentFeeReceiptAction={submitEnrollmentFeeReceipt}
    />
  );
}
