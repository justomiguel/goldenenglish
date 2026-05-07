import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { prepareTeacherSectionAttendancePage } from "@/lib/academics/prepareTeacherSectionAttendancePage";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { resolveStaffAssistantPortal } from "@/lib/dashboard/resolveStaffAssistantPortal";
import { SectionAttendancePageBody } from "@/components/organisms/SectionAttendancePageBody";
import type { TeacherAttendanceScope } from "@/components/molecules/TeacherAttendanceScopeLinks";

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
  searchParams: Promise<{ scope?: string | string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.teacherSectionAttendance.metaTitle,
    robots: { index: false, follow: false },
  };
}

function parseScope(raw: string | string[] | undefined): TeacherAttendanceScope {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "full" ? "full" : "operational";
}

export default async function AssistantSectionAttendancePage({ params, searchParams }: PageProps) {
  const { locale, sectionId } = await params;
  const scope = parseScope((await searchParams).scope);
  const dict = await getDictionary(locale);
  const d = dict.dashboard.teacherSectionAttendance;
  const dAssist = dict.dashboard.assistantDashboard;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const roleOk = await resolveStaffAssistantPortal(supabase, user.id);
  if (!roleOk) redirect(`/${locale}/dashboard`);

  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) redirect(`/${locale}/dashboard`);

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

  const assistantBase = `/${locale}/dashboard/assistant`;
  const buildScopeHref = (s: TeacherAttendanceScope) => {
    const base = `${assistantBase}/sections/${sectionId}/attendance`;
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
      backHref={assistantBase}
      backLabel={dAssist.backToAssistantHome}
      buildScopeHref={buildScopeHref}
    />
  );
}
