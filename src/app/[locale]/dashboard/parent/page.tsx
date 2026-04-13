import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadParentChildrenSummaries } from "@/lib/parent/loadParentChildrenSummaries";
import { loadParentFamilyHubModel } from "@/lib/parent/loadParentFamilyHubModel";
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

  const summaries = await loadParentChildrenSummaries(supabase, user.id);
  const hub = await loadParentFamilyHubModel(
    supabase,
    user.id,
    locale,
    dict.dashboard.parent.hub.icsEventTitle,
  );

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

  return (
    <ParentDashboardEntry
      locale={locale}
      title={dict.dashboard.parent.title}
      lead={dict.dashboard.parent.lead}
      navPay={dict.dashboard.parent.navPay}
      payHref={payHref}
      kids={kids}
      summaries={summaries}
      selectedStudentId={selectedStudentId}
      parentLabels={dict.dashboard.parent}
      hub={hub}
    />
  );
}
