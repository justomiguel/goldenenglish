import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { ParentPaymentsEntry } from "@/components/parent/ParentPaymentsEntry";
import { BillingPortalScreen } from "@/components/billing/BillingPortalScreen";
import { loadStudentSelfPaymentsPagePayload } from "@/lib/billing/loadStudentSelfPaymentsPagePayload";
import {
  submitStudentPaymentReceipt,
  submitEnrollmentFeeReceipt,
} from "@/app/[locale]/dashboard/student/payments/actions";
import { startStudentFlowMonthlyPayment } from "@/app/[locale]/dashboard/student/payments/flowMonthlyPaymentActions";
import { startStudentMercadoPagoMonthlyPayment } from "@/app/[locale]/dashboard/student/payments/mercadoPagoMonthlyPaymentActions";
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
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "student") redirect(`/${locale}/dashboard`);

  const perms = await getProfilePermissions(supabase, user.id);
  if (perms && !perms.canAccessPaymentsModule) {
    redirect(`/${locale}/dashboard/student`);
  }

  const displayName = formatProfileNameSurnameFirst(profile.first_name, profile.last_name);
  const payload = await loadStudentSelfPaymentsPagePayload(
    supabase,
    user.id,
    displayName || user.id,
  );

  const feesPanel = (
    <BillingPortalScreen
      locale={locale}
      viewer="student"
      isMinorStudent={false}
      dict={dict.dashboard.portalBilling}
      fileUploadProgress={dict.common.fileUpload}
      invoices={payload.selectedInvoices}
    />
  );

  return (
    <Suspense fallback={<div className="h-32 animate-pulse rounded bg-[var(--color-muted)]" aria-hidden />}>
      <ParentPaymentsEntry
        locale={locale as Locale}
        title={dict.dashboard.parent.paymentsTitle}
        lead={dict.dashboard.parent.paymentsLead}
        options={payload.options}
        selectedStudentId={payload.selectedStudentId}
        monthlyView={payload.monthlyView}
        familySummary={payload.familySummary}
        payments={payload.paymentRows}
        financialAccessRevoked={payload.accessRevoked}
        labels={dict.dashboard.parent}
        studentLabels={dict.dashboard.student}
        submitReceiptAction={submitStudentPaymentReceipt}
        submitEnrollmentFeeReceiptAction={submitEnrollmentFeeReceipt}
        fileUploadProgress={dict.common.fileUpload}
        enabledOnlineGateways={payload.enabledOnlineGateways}
        startFlowMonthlyPaymentAction={
          payload.enabledOnlineGateways.includes("flow") ? startStudentFlowMonthlyPayment : undefined
        }
        startMercadoPagoMonthlyPaymentAction={
          payload.enabledOnlineGateways.includes("mercadopago")
            ? startStudentMercadoPagoMonthlyPayment
            : undefined
        }
        feesPanel={feesPanel}
        initialFocus={payload.initialFocus}
        bankTransferInstructions={payload.bankTransferInstructions}
      />
    </Suspense>
  );
}
