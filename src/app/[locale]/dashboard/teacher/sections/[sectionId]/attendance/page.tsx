import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { getTeacherPortalAllowedRoles } from "@/lib/academics/getTeacherPortalAllowedRoles";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import { enrollmentEligibleForAttendanceOnDate } from "@/lib/academics/sectionEnrollmentEligibleOnDate";
import { utcCalendarDateIso, minTeacherAttendanceDateIso } from "@/lib/academics/sectionAttendanceDateWindow";
import { SectionAttendanceBoard } from "@/components/organisms/SectionAttendanceBoard";

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
  searchParams: Promise<{ date?: string }>;
}

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.teacherSectionAttendance.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function TeacherSectionAttendancePage({ params, searchParams }: PageProps) {
  const { locale, sectionId } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.teacherSectionAttendance;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const allowedRoles = getTeacherPortalAllowedRoles();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile?.role || !allowedRoles.includes(profile.role)) {
    const isAdmin = await resolveIsAdminSession(supabase, user.id);
    if (isAdmin) redirect(`/${locale}/dashboard/admin/academic`);
    redirect(`/${locale}/dashboard`);
  }

  const { data: section, error: secErr } = await supabase
    .from("academic_sections")
    .select("id, name, teacher_id")
    .eq("id", sectionId)
    .maybeSingle();
  if (secErr || !section || (section.teacher_id as string) !== user.id) notFound();

  const today = utcCalendarDateIso();
  const minD = minTeacherAttendanceDateIso();
  const requested = sp.date && isIsoDate(sp.date) ? sp.date : today;
  let dateIso = requested;
  if (requested < minD) dateIso = minD;
  if (requested > today) dateIso = today;
  const clamped = requested !== dateIso;

  const { data: holidayRow, error: holidayErr } = await supabase
    .from("academic_no_class_days")
    .select("label")
    .eq("on_date", dateIso)
    .maybeSingle();
  const holidayLabel =
    !holidayErr && holidayRow ? ((holidayRow as { label?: string }).label ?? "").trim() : "";
  const irregularHoliday = Boolean(!holidayErr && holidayRow);
  const dow = new Date(`${dateIso}T12:00:00.000Z`).getUTCDay();
  const irregularSunday = dow === 0;

  const { data: enrollments } = await supabase
    .from("section_enrollments")
    .select("id, status, student_id, created_at, updated_at, profiles(first_name,last_name)")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: false });

  const raw = (enrollments ?? []) as {
    id: string;
    status: string;
    student_id: string;
    created_at: string;
    updated_at: string;
    profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
  }[];

  const students = raw
    .filter((r) =>
      enrollmentEligibleForAttendanceOnDate(
        dateIso,
        String(r.created_at ?? ""),
        String(r.status ?? ""),
        String(r.updated_at ?? ""),
      ),
    )
    .map((r) => {
      const pRaw = r.profiles;
      const p = Array.isArray(pRaw) ? pRaw[0] : pRaw;
      const label = p ? `${p.first_name} ${p.last_name}`.trim() : r.student_id;
      return { enrollmentId: r.id, label };
    });

  const ids = students.map((s) => s.enrollmentId);
  const initial: Record<string, { status: SectionAttendanceStatusDb; notes: string }> = {};
  for (const s of students) {
    initial[s.enrollmentId] = { status: "present", notes: "" };
  }

  if (ids.length) {
    const { data: existing } = await supabase
      .from("section_attendance")
      .select("enrollment_id, status, notes")
      .eq("attended_on", dateIso)
      .in("enrollment_id", ids);
    for (const row of existing ?? []) {
      const eid = row.enrollment_id as string;
      initial[eid] = {
        status: row.status as SectionAttendanceStatusDb,
        notes: (row.notes as string | null) ?? "",
      };
    }
  }

  const initialJson = JSON.stringify(initial);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/dashboard/teacher/sections/${sectionId}`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.backToSection}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{d.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{section.name as string}</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="attendance-date">
            {d.dateLabel}
          </label>
          <input
            id="attendance-date"
            type="date"
            name="date"
            defaultValue={dateIso}
            min={minD}
            max={today}
            className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="min-h-[44px] rounded-[var(--layout-border-radius)] bg-[var(--color-muted)] px-4 text-sm font-medium text-[var(--color-foreground)]"
        >
          {d.dateApply}
        </button>
      </form>
      <p className="text-xs text-[var(--color-muted-foreground)]">{d.dateMinHint}</p>
      {clamped ? (
        <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
          {d.dateClampedHint}
        </p>
      ) : null}

      <SectionAttendanceBoard
        key={`${sectionId}-${dateIso}`}
        locale={locale}
        sectionId={sectionId}
        dateIso={dateIso}
        initialJson={initialJson}
        students={students}
        irregularSunday={irregularSunday}
        irregularHoliday={irregularHoliday}
        holidayLabel={holidayLabel}
        dict={d}
      />
    </div>
  );
}
