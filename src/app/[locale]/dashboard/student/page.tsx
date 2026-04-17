import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { StudentDashboardEntry } from "@/components/student/StudentDashboardEntry";
import type { AttendanceRow } from "@/lib/attendance/stats";
import { loadStudentHubModel } from "@/lib/student/loadStudentHubModel";
import { studentEnrollmentRenewalKind } from "@/lib/student/studentEnrollmentRenewalNotice";
import { getStudentEnrollmentRenewalWarnDaysFromSystem } from "@/lib/student/studentEnrollmentRenewalWarnDays";
import { buildDashboardGreeting } from "@/lib/dashboard/buildDashboardGreeting";

export const metadata: Metadata = {
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

  const { data: prof } = await supabase
    .from("profiles")
    .select("engagement_points, is_minor, last_enrollment_paid_at, first_name")
    .eq("id", user.id)
    .maybeSingle();

  const engagementPoints =
    prof && typeof prof === "object" && "engagement_points" in prof
      ? Number((prof as { engagement_points?: number }).engagement_points ?? 0)
      : 0;

  const isMinor = Boolean((prof as { is_minor?: boolean } | null)?.is_minor);
  const lastPaid = (prof as { last_enrollment_paid_at?: string | null } | null)?.last_enrollment_paid_at ?? null;
  const enrollmentRenewalWarnDays = getStudentEnrollmentRenewalWarnDaysFromSystem();
  const enrollmentRenewalKind = studentEnrollmentRenewalKind(
    isMinor,
    lastPaid,
    new Date(),
    enrollmentRenewalWarnDays,
  );

  const { data: rows } = await supabase
    .from("section_attendance")
    .select("attended_on, status, section_enrollments!inner(student_id)")
    .eq("section_enrollments.student_id", user.id)
    .order("attended_on", { ascending: true });

  const normalized: AttendanceRow[] = (rows ?? []).map((r) => ({
    attendance_date: String(r.attended_on),
    status: r.status as AttendanceRow["status"],
  }));

  const hub = await loadStudentHubModel(supabase, user.id, locale);
  const { data: crInbox } = await supabase
    .from("class_reminder_in_app")
    .select("id, title, body, created_at")
    .eq("recipient_user_id", user.id)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(6);
  const { greeting, fullDateLine } = buildDashboardGreeting(locale, dict);
  const firstName = (prof as { first_name?: string | null } | null)?.first_name ?? null;

  return (
    <StudentDashboardEntry
      locale={locale}
      title={dict.dashboard.student.title}
      kicker={dict.dashboard.student.kicker}
      greeting={greeting}
      fullDateLine={fullDateLine}
      firstName={firstName}
      engagementPoints={engagementPoints}
      rows={normalized}
      labels={dict.dashboard.student}
      hub={hub}
      enrollmentRenewalKind={enrollmentRenewalKind}
      classReminderInbox={(crInbox ?? []) as { id: string; title: string; body: string; created_at: string }[]}
    />
  );
}
