import { notFound, redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { prepareTeacherSectionAttendancePage } from "@/lib/academics/prepareTeacherSectionAttendancePage";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { SectionAttendancePageBody } from "@/components/organisms/SectionAttendancePageBody";
import type { TeacherAttendanceScope } from "@/components/molecules/TeacherAttendanceScopeLinks";

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
  searchParams: Promise<{ scope?: string | string[] }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.teacherSectionAttendance.metaTitle);
}

function parseScope(raw: string | string[] | undefined): TeacherAttendanceScope {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "full" ? "full" : "operational";
}

export default async function TeacherSectionAttendancePage({ params, searchParams }: PageProps) {
  const { locale, sectionId } = await params;
  const scope = parseScope((await searchParams).scope);
  const dict = await getDictionary(locale);
  const d = dict.dashboard.teacherSectionAttendance;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) {
    const isAdmin = await resolveIsAdminSession(supabase, user.id);
    if (isAdmin) redirect(`/${locale}/dashboard/admin/academic`);
    redirect(`/${locale}/dashboard`);
  }

  const { data: section, error: secErr } = await supabase
    .from("academic_sections")
    .select("id, name, teacher_id, starts_on, ends_on, schedule_slots")
    .eq("id", sectionId)
    .maybeSingle();
  const canOpen =
    !secErr &&
    section &&
    (await userIsSectionTeacherOrAssistant(supabase, user.id, sectionId));
  if (!canOpen) notFound();

  const prep = await prepareTeacherSectionAttendancePage({
    supabase,
    sectionId,
    scope,
    locale,
    scheduleSummaryLead: d.scheduleSummaryLead,
    section: section as { starts_on?: string | null; ends_on?: string | null; schedule_slots?: unknown },
  });

  const sectionHome = `/${locale}/dashboard/teacher/sections/${sectionId}`;
  const buildScopeHref = (s: TeacherAttendanceScope) => {
    const base = `/${locale}/dashboard/teacher/sections/${sectionId}/attendance`;
    return s === "full" ? `${base}?scope=full` : base;
  };

  return (
    <SectionAttendancePageBody
      locale={locale}
      sectionId={sectionId}
      scope={scope}
      sectionName={section.name as string}
      prep={prep}
      dict={d}
      backHref={sectionHome}
      backLabel={d.backToSection}
      buildScopeHref={buildScopeHref}
    />
  );
}
