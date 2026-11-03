import Link from "next/link";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requirePortalPageActor } from "@/lib/dashboard/requirePortalPageActor";
import { loadStudentCourses } from "@/lib/courses/loadStudentCourses";
import { loadLessonMaterials } from "@/lib/courses/loadLessonMaterials";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { StudentLearningTasksEntry } from "@/components/student/StudentLearningTasksEntry";
import { LessonMaterialList } from "@/components/student/LessonMaterialList";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.student.courses.open);
}

interface PageProps {
  params: Promise<{ locale: string; courseId: string; lessonId: string }>;
}

export default async function StudentLessonPage({ params }: PageProps) {
  const { locale, courseId, lessonId } = await params;
  const dict = await getDictionary(locale);
  const copy = dict.dashboard.student.courses;
  const { supabase, viewerId } = await requirePortalPageActor(
    locale,
    "student",
    `/${locale}/dashboard/student/courses/${courseId}/lessons/${lessonId}`,
  );
  const courses = await loadStudentCourses(supabase, viewerId);
  const course = courses.find((row) => row.id === courseId);
  const lesson = course?.modules.flatMap((module) => module.lessons).find((row) => row.id === lessonId);
  if (!course || !lesson) notFound();

  const back = `/${locale}/dashboard/student/progress`;
  const locked = (
    <article className="mx-auto max-w-2xl space-y-3">
      <h1 className="font-display text-2xl font-semibold text-[var(--color-foreground)]">{lesson.title}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.locked}</p>
      <Link href={back} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline">
        {copy.backToCourse}
      </Link>
    </article>
  );
  if (!lesson.unlocked) {
    return <StudentLearningTasksEntry>{locked}</StudentLearningTasksEntry>;
  }

  const { data } = await supabase.from("course_lessons").select("content_template_id").eq("id", lessonId).maybeSingle();
  const templateId = (data as { content_template_id?: string | null } | null)?.content_template_id;
  const materials = templateId ? await loadLessonMaterials(await createAdminClient(), templateId) : [];
  await recordUserEventServer({
    userId: viewerId,
    eventType: "action",
    entity: "course_lesson",
    metadata: { lesson_id: lessonId },
  });

  return (
    <StudentLearningTasksEntry>
      <article className="mx-auto max-w-2xl space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{course.title}</p>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-foreground)]">{lesson.title}</h1>
        <LessonMaterialList items={materials} emptyLabel={copy.materialsEmpty} />
        <Link href={back} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline">
          {copy.backToCourse}
        </Link>
      </article>
    </StudentLearningTasksEntry>
  );
}
