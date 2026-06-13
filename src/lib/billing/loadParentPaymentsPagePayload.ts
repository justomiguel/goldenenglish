import type { SupabaseClient } from "@supabase/supabase-js";
import type { TutorLinkedStudentOption } from "@/components/parent/ParentPaymentsEntry";
import {
  effectiveAmountAfterScholarship,
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";
import { listTutorStudentsWithFinance } from "@/lib/auth/listTutorStudentsWithFinance";
import { loadStudentMonthlyPaymentsView } from "@/lib/billing/loadStudentMonthlyPaymentsView";
import { buildFamilyPaymentsSummary } from "@/lib/billing/buildFamilyPaymentsSummary";
import { findStudentPaymentsInitialFocus } from "@/lib/billing/findStudentPaymentsInitialFocus";
import { studentReceiptSignedUrl } from "@/lib/payments/studentReceiptSignedUrl";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { loadBankTransferInstructionsSetting } from "@/lib/billing/loadBankTransferInstructionsSetting";
import { loadEnabledGatewaysForBillingCurrency } from "@/lib/payment-gateways/loadEnabledGatewaysForBillingCurrency";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";
import type { StudentPaymentRow } from "@/components/student/StudentPaymentsHistory";
import type { BillingInvoiceRow } from "@/types/billing";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";

export interface ParentPaymentsPagePayload {
  options: TutorLinkedStudentOption[];
  selectedStudentId: string | null;
  accessRevoked: boolean;
  familySummary: ReturnType<typeof buildFamilyPaymentsSummary>;
  monthlyView: StudentMonthlyPaymentsView | null;
  paymentRows: StudentPaymentRow[];
  initialFocus: ReturnType<typeof findStudentPaymentsInitialFocus>;
  selectedInvoices: BillingInvoiceRow[];
  enabledOnlineGateways: PaymentGatewayProvider[];
  bankTransferInstructions: string | null;
}

export async function loadParentPaymentsPagePayload(
  supabase: SupabaseClient,
  tutorUserId: string,
  requestedStudentId: string | null,
): Promise<ParentPaymentsPagePayload> {
  const linkedStudents = await listTutorStudentsWithFinance(supabase, tutorUserId);
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

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const childrenPayload = await Promise.all(
    linkedStudents.map(async (row) => {
      if (!row.financialAccessActive) {
        return {
          studentId: row.studentId,
          displayName: row.displayName || row.studentId,
          financialAccessActive: false,
          monthlyView: null,
          invoices: [] as BillingInvoiceRow[],
        };
      }

      const monthlyView = await loadStudentMonthlyPaymentsView(supabase, row.studentId, [], {
        todayYear,
        todayMonth,
      });

      const { data: invRows } = await supabase
        .from("billing_invoices")
        .select(
          "id, student_id, amount, due_date, status, description, external_reference_id, created_at, updated_at",
        )
        .eq("student_id", row.studentId)
        .neq("status", "voided")
        .order("due_date", { ascending: true });

      return {
        studentId: row.studentId,
        displayName: row.displayName || row.studentId,
        financialAccessActive: true,
        monthlyView,
        invoices: (invRows ?? []) as BillingInvoiceRow[],
      };
    }),
  );

  const familySummary = buildFamilyPaymentsSummary(childrenPayload);

  const monthlyView = selected?.financialAccessActive
    ? childrenPayload.find((c) => c.studentId === selectedStudentId)?.monthlyView ?? null
    : null;

  let paymentRows: StudentPaymentRow[] = [];
  const initialFocus = monthlyView ? findStudentPaymentsInitialFocus(monthlyView) : null;

  if (selected && selected.financialAccessActive && monthlyView) {
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
      .order("month", { ascending: true })
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

  const [billingCurrency, bankTransferInstructions] = await Promise.all([
    loadBillingCurrencySetting(supabase),
    loadBankTransferInstructionsSetting(supabase),
  ]);
  const enabledGateways = await loadEnabledGatewaysForBillingCurrency(supabase, billingCurrency.currency);
  const enabledOnlineGateways = enabledGateways.map((g) => g.provider) as PaymentGatewayProvider[];

  const selectedInvoices =
    childrenPayload.find((c) => c.studentId === selectedStudentId)?.invoices ?? [];

  return {
    options,
    selectedStudentId,
    accessRevoked,
    familySummary,
    monthlyView,
    paymentRows,
    initialFocus,
    selectedInvoices,
    enabledOnlineGateways,
    bankTransferInstructions: bankTransferInstructions.instructions,
  };
}
