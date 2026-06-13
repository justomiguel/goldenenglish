import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ParentPaymentsEntry } from "@/components/parent/ParentPaymentsEntry";
import { BillingPortalScreen } from "@/components/billing/BillingPortalScreen";
import { loadParentPaymentsPagePayload } from "@/lib/billing/loadParentPaymentsPagePayload";
import { submitTutorPaymentReceipt } from "@/app/[locale]/dashboard/parent/payments/actions";
import { submitTutorEnrollmentFeeReceipt } from "@/app/[locale]/dashboard/parent/payments/submitTutorEnrollmentFeeReceiptAction";
import { startTutorFlowMonthlyPayment } from "@/app/[locale]/dashboard/parent/payments/flowMonthlyPaymentActions";
import { startTutorMercadoPagoMonthlyPayment } from "@/app/[locale]/dashboard/parent/payments/mercadoPagoMonthlyPaymentActions";
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

  const payload = await loadParentPaymentsPagePayload(
    supabase,
    user.id,
    requestedStudentId ?? null,
  );

  const feesPanel = (
    <BillingPortalScreen
      locale={locale}
      viewer="parent"
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
        submitReceiptAction={submitTutorPaymentReceipt}
        submitEnrollmentFeeReceiptAction={submitTutorEnrollmentFeeReceipt}
        fileUploadProgress={dict.common.fileUpload}
        enabledOnlineGateways={payload.enabledOnlineGateways}
        startFlowMonthlyPaymentAction={
          payload.enabledOnlineGateways.includes("flow") ? startTutorFlowMonthlyPayment : undefined
        }
        startMercadoPagoMonthlyPaymentAction={
          payload.enabledOnlineGateways.includes("mercadopago")
            ? startTutorMercadoPagoMonthlyPayment
            : undefined
        }
        feesPanel={feesPanel}
        initialFocus={payload.initialFocus}
        bankTransferInstructions={payload.bankTransferInstructions}
      />
    </Suspense>
  );
}
