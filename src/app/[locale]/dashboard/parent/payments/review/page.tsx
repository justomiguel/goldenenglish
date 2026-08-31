import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { loadParentPaymentsPagePayload } from "@/lib/billing/loadParentPaymentsPagePayload";
import { listPayableParentMonthSections } from "@/lib/billing/listPayableParentMonthSections";
import { loadFamilyBillingPolicy } from "@/lib/billing/loadFamilyBillingPolicy";
import { loadStudentPaidTrialCredit } from "@/lib/billing/loadStudentPaidTrialCredit";
import { createAdminClient } from "@/lib/supabase/admin";
import { withParentFocusHref } from "@/lib/parent/withParentFocusHref";
import { ParentMonthlyPaymentReviewScreen } from "@/components/parent/ParentMonthlyPaymentReviewScreen";
import { submitTutorMonthlyReviewReceipt } from "@/app/[locale]/dashboard/parent/payments/reviewActions";
import {
  startTutorFlowMonthlyReviewPayment,
  startTutorMercadoPagoMonthlyReviewPayment,
} from "@/app/[locale]/dashboard/parent/payments/reviewGatewayActions";
import type { Locale } from "@/types/i18n";
import type { ParentMonthlyPayScope } from "@/lib/billing/listPayableParentMonthSections";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parent.paymentsReview.title);
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    studentId?: string;
    sectionId?: string;
    month?: string;
    year?: string;
    scope?: string;
  }>;
}

export default async function ParentPaymentsReviewPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "parent") redirect(`/${locale}/dashboard`);

  const studentId = typeof sp.studentId === "string" ? sp.studentId : "";
  const sectionId = typeof sp.sectionId === "string" ? sp.sectionId : "";
  const month = Number(sp.month);
  const year = Number(sp.year);
  const paymentsHref = `/${locale}/dashboard/parent/payments`;
  if (!studentId || !sectionId || !Number.isInteger(month) || !Number.isInteger(year)) {
    redirect(paymentsHref);
  }

  const payload = await loadParentPaymentsPagePayload(supabase, user.id, studentId);
  if (!payload.monthlyView || payload.accessRevoked || payload.selectedStudentId !== studentId) {
    redirect(withParentFocusHref(paymentsHref, { studentId, sectionId }));
  }

  const origin = payload.monthlyView.rows.find((r) => r.sectionId === sectionId);
  const admin = createAdminClient();
  const { data: studentProfile } = await admin
    .from("profiles")
    .select("dni_or_passport")
    .eq("id", studentId)
    .maybeSingle();
  const [policy, trialCredit] = await Promise.all([
    loadFamilyBillingPolicy(supabase),
    loadStudentPaidTrialCredit(admin, {
      studentId,
      dni: studentProfile?.dni_or_passport == null ? null : String(studentProfile.dni_or_passport),
    }),
  ]);
  const scope: ParentMonthlyPayScope = sp.scope === "all" ? "all" : "current";
  const currentLines = listPayableParentMonthSections({
    view: payload.monthlyView,
    originSectionId: sectionId,
    month,
    year,
    scope: "current",
    useFullMonthAmount: true,
  }).lines;
  const allLines = listPayableParentMonthSections({
    view: payload.monthlyView,
    originSectionId: sectionId,
    month,
    year,
    scope: "all",
    useFullMonthAmount: true,
  }).lines;

  const studentName =
    payload.options.find((o) => o.studentId === studentId)?.displayName ?? studentId;
  const backHref = withParentFocusHref(paymentsHref, { studentId, sectionId });
  const reviewHrefBase = withParentFocusHref(
    `${paymentsHref}/review?studentId=${studentId}&sectionId=${sectionId}&month=${month}&year=${year}`,
    { studentId, sectionId },
  );

  return (
    <ParentMonthlyPaymentReviewScreen
      locale={locale as Locale}
      studentId={studentId}
      originSectionId={sectionId}
      originSectionName={origin?.sectionName ?? sectionId}
      month={month}
      year={year}
      scope={scope}
      allowPartialPayments={policy.allowParentPartialSectionPayments}
      trialCreditAvailable={
        trialCredit ? Math.max(0, trialCredit.trialPaid - trialCredit.alreadyCredited) : 0
      }
      creditEnabled={policy.creditPaidTrialOnEnroll}
      studentName={studentName}
      currentLines={currentLines}
      allLines={allLines}
      backHref={backHref}
      reviewHrefBase={reviewHrefBase}
      labels={dict.dashboard.parent.paymentsReview}
      studentLabels={dict.dashboard.student}
      fileUploadProgress={dict.common.fileUpload}
      bankTransferInstructions={payload.bankTransferInstructions}
      enabledOnlineGateways={payload.enabledOnlineGateways}
      submitReceiptAction={submitTutorMonthlyReviewReceipt}
      startFlowAction={
        payload.enabledOnlineGateways.includes("flow") ? startTutorFlowMonthlyReviewPayment : undefined
      }
      startMercadoPagoAction={
        payload.enabledOnlineGateways.includes("mercadopago")
          ? startTutorMercadoPagoMonthlyReviewPayment
          : undefined
      }
    />
  );
}
