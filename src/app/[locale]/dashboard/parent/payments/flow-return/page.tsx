import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PaymentsFlowReturnSurfaceEntry } from "@/components/organisms/PaymentsFlowReturnSurfaceEntry";
import { resolveFlowMonthlyPaymentReturnPage } from "@/lib/billing/resolveFlowMonthlyPaymentReturnPage";
import { buildFlowReturnReceiptSection } from "@/lib/billing/buildFlowReturnReceiptSection";
import { formatFlowReturnPageCopy } from "@/lib/student/formatFlowReturnPageCopy";
import type { Locale } from "@/types/i18n";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ParentPaymentsFlowReturnPage({ params, searchParams }: PageProps) {
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
    .maybeSingle();
  if (profile?.role !== "parent") redirect(`/${locale}/dashboard`);

  const localeTyped = locale as Locale;
  const dict = await getDictionary(localeTyped);
  const monthly = dict.dashboard.student.monthly;
  const model = await resolveFlowMonthlyPaymentReturnPage({ supabase, token });
  const presentation = formatFlowReturnPageCopy(localeTyped, monthly, model);

  const receiptSection =
    model.outcome === "success"
      ? await buildFlowReturnReceiptSection({
          supabase,
          locale: localeTyped,
          monthlyDict: monthly,
          paymentId: model.paymentId,
        })
      : null;

  return (
    <PaymentsFlowReturnSurfaceEntry
      backHref={`/${locale}/dashboard/parent/payments`}
      backLabel={monthly.flowReturnBack}
      title={presentation.title}
      lead={presentation.lead}
      variant={presentation.variant}
      belowStatusContent={receiptSection}
    />
  );
}
