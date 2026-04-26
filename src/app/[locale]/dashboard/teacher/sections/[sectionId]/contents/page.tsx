import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { loadLearningRouteWorkspace } from "@/lib/learning-content/loadLearningRouteWorkspace";
import { loadTeacherAssessmentAttempts } from "@/lib/learning-content/loadTeacherAssessmentAttempts";
import {
  TeacherSectionContentsScreen,
  type TeacherContentStudent,
} from "@/components/teacher/TeacherSectionContentsScreen";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
}

type EnrollmentRow = {
  student_id: string;
  profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
};

function profileName(raw: EnrollmentRow["profiles"]): string {
  const profile = Array.isArray(raw) ? raw[0] : raw;
  return profile ? `${profile.first_name} ${profile.last_name}`.trim() : "";
}

export default async function TeacherSectionContentsPage({ params }: PageProps) {
  const { locale, sectionId } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) redirect(`/${locale}/dashboard`);
  const canOpen = await userIsSectionTeacherOrAssistant(supabase, user.id, sectionId);
  if (!canOpen) notFound();

  const [workspace, attempts, { data: enrollments }] = await Promise.all([
    loadLearningRouteWorkspace(supabase, sectionId),
    loadTeacherAssessmentAttempts(supabase, sectionId),
    supabase
      .from("section_enrollments")
      .select("student_id, profiles!section_enrollments_student_id_fkey(first_name, last_name)")
      .eq("section_id", sectionId)
      .eq("status", "active")
      .limit(80),
  ]);

  const students: TeacherContentStudent[] = ((enrollments ?? []) as EnrollmentRow[]).map((row) => ({
    id: row.student_id,
    label: profileName(row.profiles) || row.student_id,
  }));

  return (
    <TeacherSectionContentsScreen
      locale={locale}
      sectionId={sectionId}
      workspace={workspace}
      students={students}
      attempts={attempts}
      labels={dict.dashboard.teacherContent}
    />
  );
}
