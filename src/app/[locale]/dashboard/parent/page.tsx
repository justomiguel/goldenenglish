import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadParentChildrenSummaries } from "@/lib/parent/loadParentChildrenSummaries";
import { loadParentFamilyHubModel } from "@/lib/parent/loadParentFamilyHubModel";
import { loadParentMonthBillingInvoiceSummary } from "@/lib/parent/loadParentMonthBillingInvoiceSummary";
import { loadParentLearningTasks } from "@/lib/learning-tasks/loadParentLearningTasks";
import { buildDashboardGreeting } from "@/lib/dashboard/buildDashboardGreeting";
import { ParentDashboardEntry } from "@/components/parent/ParentDashboardEntry";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ child?: string }>;
}

export default async function ParentDashboardPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const [{ data: profile }, summaries, hub, monthBillingSummary, learningTasks] = await Promise.all([
    supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle(),
    loadParentChildrenSummaries(supabase, user.id),
    loadParentFamilyHubModel(
      supabase,
      user.id,
      locale,
      dict.dashboard.parent.hub.icsEventTitle,
    ),
    loadParentMonthBillingInvoiceSummary(supabase, user.id, locale),
    loadParentLearningTasks(supabase, user.id),
  ]);

  const kids = summaries.map((s) => ({
    id: s.studentId,
    first_name: s.firstName,
    last_name: s.lastName,
  }));

  const childParam = typeof sp.child === "string" ? sp.child : undefined;
  const selectedStudentId =
    childParam && summaries.some((s) => s.studentId === childParam)
      ? childParam
      : summaries[0]?.studentId;

  const payHref = `/${locale}/dashboard/parent/payments`;
  const { greeting, fullDateLine } = buildDashboardGreeting(locale, dict);
  const firstName = (profile?.first_name as string | null) ?? null;

  return (
    <ParentDashboardEntry
      locale={locale}
      title={dict.dashboard.parent.title}
      lead={dict.dashboard.parent.lead}
      kicker={dict.dashboard.parent.kicker}
      greeting={greeting}
      fullDateLine={fullDateLine}
      firstName={firstName}
      navPay={dict.dashboard.parent.navPay}
      payHref={payHref}
      kids={kids}
      summaries={summaries}
      selectedStudentId={selectedStudentId}
      parentLabels={dict.dashboard.parent}
      hub={hub}
      learningTasks={learningTasks}
      monthBillingSummary={monthBillingSummary}
    />
  );
}
