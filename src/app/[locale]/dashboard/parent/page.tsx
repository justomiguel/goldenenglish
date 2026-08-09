import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadParentFamilyHubModel } from "@/lib/parent/loadParentFamilyHubModel";
import { loadParentHomeMessageSignals } from "@/lib/parent/loadParentHomeMessageSignals";
import { loadParentHomePaymentOverdueSignals } from "@/lib/parent/loadParentHomePaymentOverdueSignals";
import { loadParentRecentAttendance } from "@/lib/parent/loadParentRecentAttendance";
import { loadStudentLearningTasks } from "@/lib/learning-tasks/loadStudentLearningTasks";
import { loadPortalCalendarPageData } from "@/lib/calendar/loadPortalCalendarPageData";
import { loadParentHomeNewsFeed } from "@/lib/parent/loadParentHomeNewsFeed";
import { loadParentFocusCatalog } from "@/lib/parent/loadParentFocusCatalog";
import { resolveParentFocus } from "@/lib/parent/resolveParentFocus";
import { buildDashboardGreeting } from "@/lib/dashboard/buildDashboardGreeting";
import { buildParentTodayFeed } from "@/lib/parent/buildParentTodayFeed";
import { withParentFocusHref } from "@/lib/parent/withParentFocusHref";
import { ParentTodayScreen } from "@/components/parent/ParentTodayScreen";
import type { ParentHomeNewsItem } from "@/lib/parent/loadParentHomeNewsFeed";
import type { ParentHubModel } from "@/types/parentHub";
import type { ParentRecentAttendanceModel } from "@/lib/parent/loadParentRecentAttendance";
import type { StudentLearningTaskRow } from "@/types/learningTasks";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parentNav.home);
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; child?: string; sectionId?: string }>;
}

function valueOr<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

export default async function ParentTodayPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const focusCatalog = await loadParentFocusCatalog(supabase, user.id);
  const focus = resolveParentFocus(focusCatalog, {
    studentId:
      typeof sp.studentId === "string" ? sp.studentId
      : typeof sp.child === "string" ? sp.child
      : null,
    sectionId: typeof sp.sectionId === "string" ? sp.sectionId : null,
  });

  // Every alert source settles on its own: a read that failed is reported as a failure,
  // never as "nothing to report", because on this screen silence means "all clear".
  const [
    profileResult,
    hubResult,
    messagesResult,
    paymentsResult,
    attendanceResult,
    tasksResult,
    calendarResult,
  ] = await Promise.allSettled([
    supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle(),
    loadParentFamilyHubModel(supabase, user.id, locale, dict.dashboard.parent.hub.icsEventTitle),
    loadParentHomeMessageSignals(supabase, user.id),
    loadParentHomePaymentOverdueSignals(supabase, user.id),
    loadParentRecentAttendance(supabase, user.id),
    focus.studentId
      ? loadStudentLearningTasks(supabase, focus.studentId, 40)
      : Promise.resolve([] as StudentLearningTaskRow[]),
    loadPortalCalendarPageData(supabase, { role: "parent", userId: user.id }),
  ]);

  const failedSources: string[] = [];
  if (messagesResult.status === "rejected") failedSources.push("messages");
  if (paymentsResult.status === "rejected") failedSources.push("payments");
  if (tasksResult.status === "rejected") failedSources.push("tasks");
  if (attendanceResult.status === "rejected") failedSources.push("attendance");

  const hub = valueOr<ParentHubModel | null>(hubResult, null);
  const messages = valueOr(messagesResult, { staffInboundCount: 0 });
  const payments = valueOr(paymentsResult, { overdueByStudent: {}, overdueInvoiceCount: 0 });
  const attendance = valueOr<ParentRecentAttendanceModel>(attendanceResult, {
    children: [],
    marks: [],
    sectionSummaries: [],
    requiredMinPercent: 0,
  });
  const tasks = valueOr<StudentLearningTaskRow[]>(tasksResult, []);
  const calendarPage = valueOr(calendarResult, {
    viewerSectionIds: [] as string[],
  } as Awaited<ReturnType<typeof loadPortalCalendarPageData>>);

  let newsItems: ParentHomeNewsItem[] = [];
  try {
    newsItems = await loadParentHomeNewsFeed(supabase, {
      locale,
      viewerSectionIds: calendarPage.viewerSectionIds,
    });
  } catch {
    // News is the least load-bearing thing here; an empty shelf is honest enough.
    newsItems = [];
  }

  const focusParams = { studentId: focus.studentId, sectionId: focus.sectionId };
  const base = `/${locale}/dashboard/parent`;
  const feed = buildParentTodayFeed({
    now: new Date(),
    hrefs: {
      payments: withParentFocusHref(`${base}/payments`, focusParams),
      messages: withParentFocusHref(`${base}/messages`, focusParams),
      tasks: withParentFocusHref(`${base}/child/tasks`, focusParams),
      attendance: withParentFocusHref(`${base}/child/attendance`, focusParams),
    },
    overdueInvoiceCount: payments.overdueInvoiceCount,
    staffInboundCount: messages.staffInboundCount,
    tasks,
    attendanceMarks: focus.studentId
      ? attendance.marks.filter((mark) => mark.studentId === focus.studentId)
      : [],
    paymentPending: focus.studentId
      ? Boolean(hub?.childPaymentPending?.[focus.studentId])
      : false,
    // Notification permission is a browser fact; the card list appends it after hydration.
    pushEligible: false,
    failedSources,
  });

  const { greeting, fullDateLine } = buildDashboardGreeting(locale, dict);
  const firstName =
    profileResult.status === "fulfilled"
      ? (profileResult.value.data?.first_name ?? "").trim()
      : "";
  const attendancePercent =
    hub?.attendanceLines.find((line) => line.studentId === focus.studentId)?.pct ?? null;
  const logistics = hub?.logisticsRows.find(
    (row) => row.studentId === focus.studentId && row.active,
  );

  return (
    <ParentTodayScreen
      locale={locale}
      greeting={firstName ? `${greeting}, ${firstName}` : greeting}
      fullDateLine={fullDateLine}
      feed={feed}
      copy={dict.dashboard.parent.today}
      child={
        focus.student
          ? {
              displayName: focus.student.displayName,
              sectionLabel: focus.section?.classLabel ?? logistics?.classLabel ?? "",
              attendancePercent,
            }
          : null
      }
      childHref={withParentFocusHref(`${base}/child`, focusParams)}
      calendarHref={withParentFocusHref(`${base}/calendar`, focusParams)}
      scheduleHuman={logistics?.scheduleHuman ?? null}
      newsItems={newsItems}
      newsLabels={dict.dashboard.parent.homeInbox.newsFeed}
    />
  );
}
