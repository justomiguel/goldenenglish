import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { loadAdminSectionAttendanceMatrix } from "@/lib/academics/loadAdminSectionAttendanceMatrix";
import { AdminSectionAttendanceMatrix } from "@/components/organisms/AdminSectionAttendanceMatrix";

interface PageProps {
  params: Promise<{ locale: string; cohortId: string; sectionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.academicSectionAttendance.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AdminSectionAttendanceMatrixPage({ params }: PageProps) {
  const { locale, cohortId, sectionId } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.academicSectionAttendance;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);

  const { data: sec, error: sErr } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id")
    .eq("id", sectionId)
    .maybeSingle();
  if (sErr || !sec || (sec.cohort_id as string) !== cohortId) notFound();

  const model = await loadAdminSectionAttendanceMatrix(supabase, sectionId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.backSection}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{d.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{sec.name as string}</p>
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted-foreground)]">{d.lead}</p>
      </div>
      <AdminSectionAttendanceMatrix
        locale={locale}
        cohortId={cohortId}
        sectionId={sectionId}
        model={model}
        dict={d}
      />
    </div>
  );
}
