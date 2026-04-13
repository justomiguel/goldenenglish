import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { loadParentPaymentPendingMap } from "@/lib/academics/parentPaymentPending";
import { AcademicSectionEnrollCard } from "@/components/organisms/AcademicSectionEnrollCard";
import { AcademicSectionRosterTable } from "@/components/organisms/AcademicSectionRosterTable";

interface PageProps {
  params: Promise<{ locale: string; cohortId: string; sectionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.academicSectionPage.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AcademicSectionPage({ params }: PageProps) {
  const { locale, cohortId, sectionId } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.academicSectionPage;
  const supabase = await createClient();

  const { data: sec, error: sErr } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id, schedule_slots, academic_cohorts(name)")
    .eq("id", sectionId)
    .maybeSingle();

  if (sErr || !sec || (sec.cohort_id as string) !== cohortId) notFound();

  const secRow = sec as {
    id: string;
    name: string;
    cohort_id: string;
    schedule_slots: unknown;
    academic_cohorts: { name: string } | { name: string }[] | null;
  };
  const cohortRaw = secRow.academic_cohorts;
  const cohortName = Array.isArray(cohortRaw) ? (cohortRaw[0]?.name ?? "") : (cohortRaw?.name ?? "");
  const sectionLabel = `${cohortName} — ${secRow.name}`;
  const slots = parseSectionScheduleSlots(secRow.schedule_slots);

  const { data: enrollments } = await supabase
    .from("section_enrollments")
    .select("id, status, student_id, profiles(first_name,last_name)")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: false });

  const rows =
    (enrollments ?? []).map((raw) => {
      const r = raw as {
        id: string;
        status: string;
        student_id: string;
        profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
      };
      const pRaw = r.profiles;
      const p = Array.isArray(pRaw) ? (pRaw[0] ?? null) : pRaw;
      const label = p ? `${p.first_name} ${p.last_name}`.trim() : r.student_id;
      return {
        enrollmentId: r.id,
        studentId: r.student_id,
        label,
        status: r.status,
      };
    }) ?? [];

  const studentIds = [...new Set(rows.map((r) => r.studentId))];
  const debtMap = await loadParentPaymentPendingMap(supabase, studentIds);
  const debtByStudentId = Object.fromEntries(debtMap);

  const { data: allSections } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id, academic_cohorts(name)")
    .neq("id", sectionId)
    .order("name");

  const moveTargets =
    (allSections ?? []).map((raw) => {
      const r = raw as {
        id: string;
        name: string;
        cohort_id: string;
        academic_cohorts: { name: string } | { name: string }[] | null;
      };
      const c = r.academic_cohorts;
      const cn = Array.isArray(c) ? (c[0]?.name ?? "") : (c?.name ?? "");
      return { id: r.id, label: `${cn} — ${r.name}` };
    }) ?? [];

  return (
    <div className="space-y-8">
      <div className="min-w-0">
        <Link
          href={`/${locale}/dashboard/admin/academic/${cohortId}`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.backCohort}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{secRow.name}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{d.sectionLead}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}/attendance`}
          className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
        >
          {dict.dashboard.academicSectionAttendance.title}
        </Link>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-primary)]">{d.scheduleTitle}</h2>
        {slots.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{d.noSchedule}</p>
        ) : (
          <ul className="list-inside list-disc text-sm text-[var(--color-foreground)]">
            {slots.map((s) => (
              <li key={`${s.dayOfWeek}-${s.startTime}`}>
                {s.dayOfWeek}: {s.startTime}–{s.endTime}
              </li>
            ))}
          </ul>
        )}
      </section>

      <AcademicSectionEnrollCard
        locale={locale}
        sectionId={sectionId}
        sectionLabel={sectionLabel}
        dict={d}
        conflictDict={dict.dashboard.academics.conflictModal}
        errors={dict.dashboard.academics.errors}
      />

      <AcademicSectionRosterTable
        locale={locale}
        sectionId={sectionId}
        rows={rows}
        moveTargets={moveTargets}
        dict={d}
        conflictDict={dict.dashboard.academics.conflictModal}
        errors={dict.dashboard.academics.errors}
        debtByStudentId={debtByStudentId}
      />
    </div>
  );
}
