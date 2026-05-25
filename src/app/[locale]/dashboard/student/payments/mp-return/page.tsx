import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PaymentsFlowReturnSurfaceEntry } from "@/components/organisms/PaymentsFlowReturnSurfaceEntry";
import { resolveMercadoPagoMonthlyPaymentReturnPage } from "@/lib/billing/resolveMercadoPagoMonthlyPaymentReturnPage";
import { formatMercadoPagoReturnPageCopy } from "@/lib/student/formatMercadoPagoReturnPageCopy";
import type { Locale } from "@/types/i18n";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function StudentPaymentsMpReturnPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

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

  const localeTyped = locale as Locale;
  const dict = await getDictionary(localeTyped);
  const monthly = dict.dashboard.student.monthly;

  const model = await resolveMercadoPagoMonthlyPaymentReturnPage({
    supabase,
    externalReference: firstParam(sp.external_reference ?? sp.payment_id),
    mpPaymentId: firstParam(sp.payment_id ?? sp.collection_id),
    returnStatus: firstParam(sp.status ?? sp.collection_status),
    countryCode: firstParam(sp.country),
  });
  const presentation = formatMercadoPagoReturnPageCopy(localeTyped, monthly, model);

  return (
    <PaymentsFlowReturnSurfaceEntry
      backHref={`/${locale}/dashboard/student/payments`}
      backLabel={monthly.mpReturnBack}
      title={presentation.title}
      lead={presentation.lead}
      variant={presentation.variant}
    />
  );
}
