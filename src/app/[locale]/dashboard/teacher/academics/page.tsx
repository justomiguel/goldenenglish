import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { TeacherAcademicsPanel } from "@/components/organisms/TeacherAcademicsPanel";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "teacher") {
    const isAdmin = await resolveIsAdminSession(supabase, user.id);
    if (isAdmin) redirect(`/${locale}/dashboard/admin/academic`);
    redirect(`/${locale}/dashboard`);
  }

  const { data: sections } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id, academic_cohorts(name)")
    .eq("teacher_id", user.id)
    .order("name");

  const rows =
    (sections ?? []).map((s) => {
      const r = s as {
        id: string;
        name: string;
        cohort_id: string;
        academic_cohorts: { name: string } | { name: string }[] | null;
      };
      const c = r.academic_cohorts;
      const cohortName = Array.isArray(c) ? (c[0]?.name ?? "") : (c?.name ?? "");
      return {
        id: r.id,
        name: r.name,
        cohortId: r.cohort_id,
        cohortName,
      };
    }) ?? [];

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
