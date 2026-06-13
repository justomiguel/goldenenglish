import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { loadChildrenSummariesForStudentIds } from "@/lib/parent/loadChildrenSummariesForStudentIds";
import { loadFamilyHubModelForStudentIds } from "@/lib/parent/loadFamilyHubModelForStudentIds";
import { loadParentHomeMessageSignals } from "@/lib/parent/loadParentHomeMessageSignals";
import { loadStudentHomePaymentOverdueSignals } from "@/lib/student/loadStudentHomePaymentOverdueSignals";
import { buildParentHomePillarSnapshot } from "@/lib/parent/buildParentHomePillarSnapshot";
import { loadPortalCalendarPageData } from "@/lib/calendar/loadPortalCalendarPageData";
import { loadParentHomeNewsFeed } from "@/lib/parent/loadParentHomeNewsFeed";
import { buildDashboardGreeting } from "@/lib/dashboard/buildDashboardGreeting";
import { ParentDashboardEntry } from "@/components/parent/ParentDashboardEntry";

export const metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const [{ data: profile }, perms] = await Promise.all([
    supabase.from("profiles").select("first_name, is_minor").eq("id", user.id).maybeSingle(),
    getProfilePermissions(supabase, user.id),
  ]);

  const isMinor = perms?.isMinor ?? Boolean(profile?.is_minor);
  const includePayments = perms?.canAccessPaymentsModule ?? !isMinor;
  const studentId = user.id;
  const dashboardBase = `/${locale}/dashboard/student`;

  const [summaries, hub, messageSignals, paymentOverdue, calendarPage] = await Promise.all([
    loadChildrenSummariesForStudentIds(supabase, [studentId]),
    loadFamilyHubModelForStudentIds(
      supabase,
      [studentId],
      locale,
      dict.dashboard.parent.hub.icsEventTitle,
    ),
    loadParentHomeMessageSignals(supabase, user.id),
    loadStudentHomePaymentOverdueSignals(supabase, studentId, isMinor),
    loadPortalCalendarPageData(supabase, { role: "student", userId: user.id }),
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

  const selectedStudentId = studentId;
  const payHref = `${dashboardBase}/payments`;
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
      dashboardBase={dashboardBase}
      includePayments={includePayments}
    />
  );
}
