import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadParentFocusCatalog } from "@/lib/parent/loadParentFocusCatalog";
import { resolveParentFocus } from "@/lib/parent/resolveParentFocus";
import { buildParentShellConfig } from "@/lib/portal/buildParentShellConfig";
import { ParentAccountScreen } from "@/components/parent/ParentAccountScreen";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; sectionId?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parent.account.pageTitle);
}

/**
 * The account sheet as a page, for deep links and for anyone who bookmarked the old
 * settings screen. Both surfaces render the same item list.
 */
export default async function ParentAccountPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/parent/account`);

  const focusCatalog = await loadParentFocusCatalog(supabase, user.id);
  const focus = resolveParentFocus(focusCatalog, {
    studentId: typeof sp.studentId === "string" ? sp.studentId : null,
    sectionId: typeof sp.sectionId === "string" ? sp.sectionId : null,
  });

  const config = buildParentShellConfig({
    locale,
    baseHref: `/${locale}/dashboard/parent`,
    dict,
    includePayments: true,
    focusCatalog,
    activeStudentId: focus.studentId,
    activeSectionId: focus.sectionId,
  });

  const copy = dict.dashboard.parent.account;

  return (
    <ParentAccountScreen
      locale={locale}
      title={copy.pageTitle}
      lead={copy.pageLead}
      items={config.accountItems}
      localeLabels={dict.common.locale}
    />
  );
}
