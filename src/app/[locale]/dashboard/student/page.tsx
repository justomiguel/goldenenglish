import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { StudentDashboardEntry } from "@/components/student/StudentDashboardEntry";
import type { AttendanceRow } from "@/lib/attendance/stats";

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
    .select("engagement_points")
    .eq("id", user.id)
    .maybeSingle();

  const engagementPoints =
    prof && typeof prof === "object" && "engagement_points" in prof
      ? Number((prof as { engagement_points?: number }).engagement_points ?? 0)
      : 0;

  const { data: rows } = await supabase
    .from("attendance")
    .select("attendance_date, status, is_mandatory")
    .eq("student_id", user.id)
    .order("attendance_date", { ascending: true });

  const normalized: AttendanceRow[] = (rows ?? []).map((r) => ({
    attendance_date: String(r.attendance_date),
    status: r.status as AttendanceRow["status"],
    is_mandatory: Boolean(r.is_mandatory),
  }));

  return (
    <StudentDashboardEntry
      title={dict.dashboard.student.title}
      engagementPoints={engagementPoints}
      rows={normalized}
      labels={dict.dashboard.student}
    />
  );
}
