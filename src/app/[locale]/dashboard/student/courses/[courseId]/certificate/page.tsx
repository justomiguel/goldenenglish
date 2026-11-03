import Link from "next/link";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requirePortalPageActor } from "@/lib/dashboard/requirePortalPageActor";
import { loadStudentCourses } from "@/lib/courses/loadStudentCourses";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { StudentCertificatePrint } from "@/components/student/StudentCertificatePrint";
import { StudentLearningTasksEntry } from "@/components/student/StudentLearningTasksEntry";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.student.courses.certificateHeading);
}

interface PageProps {
  params: Promise<{ locale: string; courseId: string }>;
}

export default async function StudentCourseCertificatePage({ params }: PageProps) {
  const { locale, courseId } = await params;
  const dict = await getDictionary(locale);
  const copy = dict.dashboard.student.courses;
  const { supabase, viewerId } = await requirePortalPageActor(
    locale,
    "student",
    `/${locale}/dashboard/student/courses/${courseId}/certificate`,
  );
  const [{ data: profile }, courses] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name").eq("id", viewerId).maybeSingle(),
    loadStudentCourses(supabase, viewerId),
  ]);
  const course = courses.find((row) => row.id === courseId);
  if (!course) notFound();
  const { data: completion } = await supabase
    .from("student_course_completions")
    .select("completed_at, revoked_at")
    .eq("student_id", viewerId)
    .eq("course_id", courseId)
    .maybeSingle();
  const saved = completion as { completed_at: string; revoked_at: string | null } | null;
  const active = Boolean(saved && !saved.revoked_at);
  const name = formatProfileNameSurnameFirst(profile?.first_name, profile?.last_name);
  const completedOn = active
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(saved!.completed_at))
    : "";
  const back = `/${locale}/dashboard/student/progress`;

  return (
    <StudentLearningTasksEntry>
      <article className="mx-auto max-w-2xl space-y-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-foreground)]">{copy.certificateHeading}</h1>
        {active ? (
          <p className="text-lg text-[var(--color-foreground)]">
            {copy.certificateLead.replace("{name}", name || "—").replace("{course}", course.title)} {completedOn}
          </p>
        ) : (
          <p className="text-sm text-[var(--color-muted-foreground)]">{copy.certificatePending}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {active ? <StudentCertificatePrint label={copy.certificatePrint} /> : null}
          <Link href={back} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline">
            {copy.backToCourse}
          </Link>
        </div>
      </article>
    </StudentLearningTasksEntry>
  );
}
