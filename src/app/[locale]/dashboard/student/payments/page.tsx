import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  effectiveAmountAfterScholarship,
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";
import { StudentPaymentsEntry } from "@/components/student/StudentPaymentsEntry";
import type { StudentPaymentRow } from "@/components/student/StudentPaymentsHistory";
import { studentReceiptSignedUrl } from "@/lib/payments/studentReceiptSignedUrl";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
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
        labels={dict.dashboard.student}
        paymentsBlockedMessage={paymentsBlockedMessage}
      />
    );
  }

  const { data: scholarshipData } = await supabase
    .from("student_scholarships")
    .select(
      "discount_percent, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
    )
    .eq("student_id", user.id)
    .maybeSingle();

  const scholarship: ScholarshipRow | null = scholarshipData
    ? {
        discount_percent: Number(scholarshipData.discount_percent),
        valid_from_year: scholarshipData.valid_from_year as number,
        valid_from_month: scholarshipData.valid_from_month as number,
        valid_until_year: scholarshipData.valid_until_year as number | null,
        valid_until_month: scholarshipData.valid_until_month as number | null,
        is_active: Boolean(scholarshipData.is_active),
      }
    : null;

  const { data: payments } = await supabase
    .from("payments")
    .select("id, month, year, amount, status, receipt_url, updated_at")
    .eq("student_id", user.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  let promoCount = 0;
  const promoRes = await supabase
    .from("student_promotions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", user.id);
  if (!promoRes.error) promoCount = promoRes.count ?? 0;

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
      const displayAmount =
        st === "exempt"
          ? amount
          : effectiveAmountAfterScholarship(amount, y, mo, scholarship);
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
      labels={dict.dashboard.student}
      paymentsBlockedMessage={paymentsBlockedMessage}
    />
  );
}
