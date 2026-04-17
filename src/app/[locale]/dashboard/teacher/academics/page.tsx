import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { TeacherAcademicsPanel } from "@/components/organisms/TeacherAcademicsPanel";
import { loadTeacherSectionIdsForUser } from "@/lib/academics/loadTeacherSectionIdsForUser";
import { chunkedIn } from "@/lib/supabase/chunkedIn";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.teacherAcademics.title,
    robots: { index: false, follow: false },
  };
}

export default async function TeacherAcademicsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

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
          academic_cohorts: { name: string } | { name: string }[] | null;
        }>(supabase, "academic_sections", "id", mySectionIds, "id, name, cohort_id, teacher_id, academic_cohorts(name)");
  sections.sort((a, b) => a.name.localeCompare(b.name));

  const rows = sections.map((r) => {
    const c = r.academic_cohorts;
    const cohortName = Array.isArray(c) ? (c[0]?.name ?? "") : (c?.name ?? "");
    return {
      id: r.id,
      name: r.name,
      cohortId: r.cohort_id,
      cohortName,
      accessRole: r.teacher_id === user.id ? ("lead" as const) : ("assistant" as const),
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
          {dict.dashboard.teacherAcademics.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {dict.dashboard.teacherAcademics.lead}
        </p>
      </header>
      <TeacherAcademicsPanel locale={locale} dict={dict} sections={rows} />
    </div>
  );
}
