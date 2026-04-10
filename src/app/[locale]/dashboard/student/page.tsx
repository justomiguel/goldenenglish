import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AttendancePlayboard } from "@/components/student/AttendancePlayboard";
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
    <div>
      <h1 className="mb-8 font-display text-3xl font-bold text-[var(--color-secondary)]">
        {dict.dashboard.student.title}
      </h1>
      <AttendancePlayboard rows={normalized} labels={dict.dashboard.student} />
    </div>
  );
}
