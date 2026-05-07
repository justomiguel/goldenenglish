import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { loadTeacherSectionIdsForUser } from "@/lib/academics/loadTeacherSectionIdsForUser";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import { StaffAssistantSectionCard } from "@/components/molecules/StaffAssistantSectionCard";
import { resolveStaffAssistantPortal } from "@/lib/dashboard/resolveStaffAssistantPortal";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.assistantDashboard.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AssistantDashboardHomePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const dDash = dict.dashboard.assistantDashboard;
  const dSections = dict.dashboard.teacherMySections;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const roleOk = await resolveStaffAssistantPortal(supabase, user.id);
  if (!roleOk) redirect(`/${locale}/dashboard`);

  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) redirect(`/${locale}/dashboard`);

  const mySectionIds = await loadTeacherSectionIdsForUser(supabase, user.id);
  const sections =
    mySectionIds.length === 0
      ? []
      : await chunkedIn<{
          id: string;
          name: string;
          cohort_id: string;
          teacher_id: string;
          schedule_slots: unknown;
          academic_cohorts: { name: string } | { name: string }[] | null;
        }>(
          supabase,
          "academic_sections",
          "id",
          mySectionIds,
          "id, name, cohort_id, teacher_id, schedule_slots, academic_cohorts(name)",
        );
  sections.sort((a, b) => a.name.localeCompare(b.name));

  const sectionList = sections.map((r) => {
    const c = r.academic_cohorts;
    const cohortName = Array.isArray(c) ? (c[0]?.name ?? "") : (c?.name ?? "");
    return {
      id: r.id,
      name: r.name,
      cohortName,
      scheduleSlots: r.schedule_slots,
      accessRole: r.teacher_id === user.id ? ("lead" as const) : ("assistant" as const),
    };
  });

  const ids = sectionList.map((s) => s.id);
  const activeBySection = new Map<string, number>();
  for (const id of ids) activeBySection.set(id, 0);
  if (ids.length) {
    const { data: countRows } = await supabase
      .from("section_enrollments")
      .select("section_id")
      .in("section_id", ids)
      .eq("status", "active");
    for (const row of countRows ?? []) {
      const sid = row.section_id as string;
      activeBySection.set(sid, (activeBySection.get(sid) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{dDash.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{dDash.lead}</p>
      </header>
      {sectionList.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{dDash.noSections}</p>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2">
          {sectionList.map((s) => (
            <li key={s.id}>
              <StaffAssistantSectionCard
                locale={locale}
                sectionId={s.id}
                name={s.name}
                cohortName={s.cohortName}
                scheduleSlots={s.scheduleSlots}
                activeStudentCount={activeBySection.get(s.id) ?? 0}
                accessRole={s.accessRole}
                sectionsDict={dSections}
                attendanceCta={dDash.openAttendanceCta}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
