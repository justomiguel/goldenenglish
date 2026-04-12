import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { receiptSignedUrlForAdmin } from "@/lib/payments/receiptSignedUrl";
import { AdminStudentBillingEntry } from "@/components/dashboard/AdminStudentBillingEntry";
import type { Locale } from "@/types/i18n";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; userId: string }>;
}

export default async function AdminStudentBillingPage({ params }: PageProps) {
  const { locale, userId } = await params;
  const dict = await getDictionary(locale);
  const idOk = z.string().uuid().safeParse(userId);
  if (!idOk.success) notFound();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, role, enrollment_fee_exempt, enrollment_exempt_reason, last_enrollment_paid_at",
    )
    .eq("id", userId)
    .single();

  if (!profile || profile.role !== "student") notFound();

  const name = `${profile.first_name} ${profile.last_name}`.trim();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, month, year, amount, status, receipt_url, admin_notes, updated_at")
    .eq("student_id", userId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  const { data: scholarship } = await supabase
    .from("student_scholarships")
    .select(
      "discount_percent, note, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
    )
    .eq("student_id", userId)
    .maybeSingle();

  const rows = await Promise.all(
    (payments ?? []).map(async (p) => ({
      id: p.id as string,
      month: p.month as number,
      year: p.year as number,
      amount: p.amount != null ? Number(p.amount) : null,
      status: p.status as string,
      admin_notes: (p.admin_notes as string | null) ?? null,
      updated_at: p.updated_at as string,
      receiptSignedUrl: p.receipt_url
        ? await receiptSignedUrlForAdmin(p.receipt_url as string)
        : null,
    })),
  );

  return (
    <AdminStudentBillingEntry
      locale={locale as Locale}
      studentId={userId}
      studentName={name}
      payments={rows}
      scholarship={scholarship}
      labels={dict.admin.billing}
      usersLabels={dict.admin.users}
      enrollmentFeeExempt={Boolean(profile.enrollment_fee_exempt)}
      enrollmentExemptReason={(profile.enrollment_exempt_reason as string | null) ?? null}
      lastEnrollmentPaidAt={(profile.last_enrollment_paid_at as string | null) ?? null}
    />
  );
}
