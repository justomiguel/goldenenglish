import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PaymentsFlowReturnSurfaceEntry } from "@/components/organisms/PaymentsFlowReturnSurfaceEntry";
import { resolveFlowMonthlyPaymentReturnPage } from "@/lib/billing/resolveFlowMonthlyPaymentReturnPage";
import { formatFlowReturnPageCopy } from "@/lib/student/formatFlowReturnPageCopy";
import type { Locale } from "@/types/i18n";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StudentPaymentsFlowReturnPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const tokenRaw = sp.token ?? sp.flowToken;
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;

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

  const dict = await getDictionary(locale as Locale);
  const monthly = dict.dashboard.student.monthly;
  const model = await resolveFlowMonthlyPaymentReturnPage({ supabase, token });
  const presentation = formatFlowReturnPageCopy(locale as Locale, monthly, model);

  return (
    <PaymentsFlowReturnSurfaceEntry
      backHref={`/${locale}/dashboard/student/payments`}
      backLabel={monthly.flowReturnBack}
      title={presentation.title}
      lead={presentation.lead}
      variant={presentation.variant}
    />
  );
}
