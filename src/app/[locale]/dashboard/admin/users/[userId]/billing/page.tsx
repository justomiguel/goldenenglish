import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadAdminStudentBillingTabData } from "@/lib/dashboard/loadAdminStudentBillingTabData";
import { AdminStudentBillingEntry } from "@/components/dashboard/AdminStudentBillingEntry";
import type { Locale } from "@/types/i18n";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

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

  const name = formatProfileNameSurnameFirst(profile.first_name, profile.last_name);

  const billing = await loadAdminStudentBillingTabData(supabase, userId);
  if (!billing) notFound();

  const defaultYear = new Date().getFullYear();

  return (
    <AdminStudentBillingEntry
      locale={locale as Locale}
      studentId={userId}
      studentName={name}
      payments={billing.payments}
      scholarships={billing.scholarships}
      sectionBenefits={billing.sectionBenefits}
      labels={dict.admin.billing}
      usersLabels={dict.admin.users}
      enrollmentFeeExempt={billing.enrollmentFeeExempt}
      enrollmentExemptReason={billing.enrollmentExemptReason}
      lastEnrollmentPaidAt={billing.lastEnrollmentPaidAt}
      defaultYear={defaultYear}
    />
  );
}
