import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadParentChildrenSummaries } from "@/lib/parent/loadParentChildrenSummaries";
import { loadParentFamilyHubModel } from "@/lib/parent/loadParentFamilyHubModel";
import { loadParentHomeMessageSignals } from "@/lib/parent/loadParentHomeMessageSignals";
import { loadParentHomePaymentOverdueSignals } from "@/lib/parent/loadParentHomePaymentOverdueSignals";
import { buildParentHomePillarSnapshot } from "@/lib/parent/buildParentHomePillarSnapshot";
import { loadPortalCalendarPageData } from "@/lib/calendar/loadPortalCalendarPageData";
import { loadParentHomeNewsFeed } from "@/lib/parent/loadParentHomeNewsFeed";
import { buildDashboardGreeting } from "@/lib/dashboard/buildDashboardGreeting";
import { ParentDashboardEntry } from "@/components/parent/ParentDashboardEntry";
import { loadParentFocusCatalog } from "@/lib/parent/loadParentFocusCatalog";
import { resolveParentFocus } from "@/lib/parent/resolveParentFocus";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parentNav.home);
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; child?: string; sectionId?: string }>;
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

  const [
    { data: profile },
    summaries,
    hub,
    messageSignals,
    paymentOverdue,
    calendarPage,
    focusCatalog,
  ] = await Promise.all([
    supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle(),
    loadParentChildrenSummaries(supabase, user.id),
    loadParentFamilyHubModel(
      supabase,
      user.id,
      locale,
      dict.dashboard.parent.hub.icsEventTitle,
    ),
    loadParentHomeMessageSignals(supabase, user.id),
    loadParentHomePaymentOverdueSignals(supabase, user.id),
    loadPortalCalendarPageData(supabase, { role: "parent", userId: user.id }),
    loadParentFocusCatalog(supabase, user.id),
  ]);

  const newsItems = await loadParentHomeNewsFeed(supabase, {
    locale,
    viewerSectionIds: calendarPage.viewerSectionIds,
  });

  const kids = summaries.map((s) => ({
    id: s.studentId,
    first_name: s.firstName,
    last_name: s.lastName,
  }));

  const rawParam =
    typeof sp.studentId === "string" ? sp.studentId
    : typeof sp.child === "string" ? sp.child
    : undefined;
  const focus = resolveParentFocus(focusCatalog, {
    studentId: rawParam,
    sectionId: typeof sp.sectionId === "string" ? sp.sectionId : undefined,
  });
  const selectedStudentId = focus.studentId ?? undefined;

  const payHref = `/${locale}/dashboard/parent/payments`;
  const { greeting, fullDateLine } = buildDashboardGreeting(locale, dict);
  const firstName = (profile?.first_name as string | null) ?? null;

  const attendanceByStudent: Record<string, number> = {};
  for (const line of hub?.attendanceLines ?? []) {
    attendanceByStudent[line.studentId] = line.pct;
  }

  const pillars = buildParentHomePillarSnapshot({
    selectedStudentId,
    attendanceByStudent,
    attendanceLevelByStudent: hub?.attendanceLevelByStudent,
    overdueByStudent: paymentOverdue.overdueByStudent,
    staffInboundCount: messageSignals.staffInboundCount,
    overdueInvoiceCount: paymentOverdue.overdueInvoiceCount,
    lastPublishedGrade:
      summaries.find((s) => s.studentId === selectedStudentId)?.lastPublishedGrade ?? null,
  });

  return (
    <ParentDashboardEntry
      locale={locale}
      lead={dict.dashboard.parent.lead}
      greeting={greeting}
      fullDateLine={fullDateLine}
      firstName={firstName}
      navPay={dict.dashboard.parent.navPay}
      payHref={payHref}
      kids={kids}
      summaries={summaries}
      selectedStudentId={selectedStudentId}
      parentLabels={dict.dashboard.parent}
      pillars={pillars}
      attendanceByStudent={attendanceByStudent}
      overdueByStudent={paymentOverdue.overdueByStudent}
      newsItems={newsItems}
      focusCatalog={focusCatalog}
    />
  );
}
