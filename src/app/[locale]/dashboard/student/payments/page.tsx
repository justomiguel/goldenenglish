import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { StudentPaymentsEntry } from "@/components/student/StudentPaymentsEntry";
import type { StudentPaymentRow } from "@/components/student/StudentPaymentsHistory";
import { studentReceiptSignedUrl } from "@/lib/payments/studentReceiptSignedUrl";

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

  const { data: payments } = await supabase
    .from("payments")
    .select("id, month, year, amount, status, receipt_url, updated_at")
    .eq("student_id", user.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  const rows: StudentPaymentRow[] = await Promise.all(
    (payments ?? []).map(async (p) => {
      const amount = p.amount != null ? Number(p.amount) : null;
      const st = p.status as "pending" | "approved" | "rejected";
      const url = await studentReceiptSignedUrl(
        supabase,
        user.id,
        p.receipt_url as string | null,
      );
      return {
        id: p.id as string,
        month: p.month as number,
        year: p.year as number,
        amount,
        status: st,
        updated_at: p.updated_at as string,
        receiptSignedUrl: url,
      };
    }),
  );

  return (
    <StudentPaymentsEntry
      title={dict.dashboard.student.paymentsTitle}
      lead={dict.dashboard.student.paymentsLead}
      payments={rows}
      labels={dict.dashboard.student}
    />
  );
}
