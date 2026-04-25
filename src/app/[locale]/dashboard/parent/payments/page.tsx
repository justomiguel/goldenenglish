import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ParentPaymentsEntry, type TutorLinkedStudentOption } from "@/components/parent/ParentPaymentsEntry";
import {
  effectiveAmountAfterScholarship,
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";
import { listTutorStudentsWithFinance } from "@/lib/auth/listTutorStudentsWithFinance";
import { loadStudentMonthlyPaymentsView } from "@/lib/billing/loadStudentMonthlyPaymentsView";
import { studentReceiptSignedUrl } from "@/lib/payments/studentReceiptSignedUrl";
import {
  submitTutorPaymentReceipt,
  submitTutorEnrollmentFeeReceipt,
} from "@/app/[locale]/dashboard/parent/payments/actions";
import type { StudentPaymentRow } from "@/components/student/StudentPaymentsHistory";
import type { Locale } from "@/types/i18n";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string }>;
}

export default async function ParentPaymentsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { studentId: requestedStudentId } = await searchParams;
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
    .maybeSingle();
  if (profile?.role !== "parent") redirect(`/${locale}/dashboard`);

  const linkedStudents = await listTutorStudentsWithFinance(supabase, user.id);
  const options: TutorLinkedStudentOption[] = linkedStudents.map((row) => ({
    studentId: row.studentId,
    displayName: row.displayName || row.studentId,
    financialAccessActive: row.financialAccessActive,
  }));

  const requested =
    requestedStudentId && options.some((opt) => opt.studentId === requestedStudentId)
      ? requestedStudentId
      : null;
  const selectedStudentId = requested ?? options[0]?.studentId ?? null;
  const selected = selectedStudentId
    ? linkedStudents.find((row) => row.studentId === selectedStudentId) ?? null
    : null;

  const accessRevoked = selected ? !selected.financialAccessActive : false;

  let monthlyView = null;
  let paymentRows: StudentPaymentRow[] = [];

  if (selected && selected.financialAccessActive) {
    const { data: scholarshipData } = await supabase
      .from("section_enrollment_scholarships")
      .select(
        "id, section_id, discount_percent, note, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
      )
      .eq("student_id", selected.studentId);
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

    const today = new Date();
    monthlyView = await loadStudentMonthlyPaymentsView(
      supabase,
      selected.studentId,
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

    const { data: payments } = await supabase
      .from("payments")
      .select("id, section_id, month, year, amount, status, receipt_url, updated_at")
      .eq("student_id", selected.studentId)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(50);

    paymentRows = await Promise.all(
      (payments ?? []).map(async (p) => {
        const amount = p.amount != null ? Number(p.amount) : null;
        const st = p.status as StudentPaymentRow["status"];
        const url = await studentReceiptSignedUrl(
          supabase,
          selected.studentId,
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
  }

  return (
    <ParentPaymentsEntry
      locale={locale as Locale}
      title={dict.dashboard.parent.paymentsTitle}
      lead={dict.dashboard.parent.paymentsLead}
      options={options}
      selectedStudentId={selectedStudentId}
      monthlyView={monthlyView}
      payments={paymentRows}
      financialAccessRevoked={accessRevoked}
      labels={dict.dashboard.parent}
      studentLabels={dict.dashboard.student}
      submitReceiptAction={submitTutorPaymentReceipt}
      submitEnrollmentFeeReceiptAction={submitTutorEnrollmentFeeReceipt}
    />
  );
}
