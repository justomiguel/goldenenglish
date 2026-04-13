import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";
import { AdminSectionCard } from "@/components/molecules/AdminSectionCard";
import { CohortSectionsToolbar } from "@/components/organisms/CohortSectionsToolbar";

interface PageProps {
  params: Promise<{ locale: string; cohortId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.academicCohortPage.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AcademicCohortPage({ params }: PageProps) {
  const { locale, cohortId } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.academicCohortPage;
  const supabase = await createClient();

  const { data: cohort, error: cErr } = await supabase
    .from("academic_cohorts")
    .select("id, name, starts_on, ends_on")
    .eq("id", cohortId)
    .maybeSingle();

  if (cErr || !cohort) notFound();

  const { data: sections } = await supabase
    .from("academic_sections")
    .select("id, name, max_students, teacher_id")
    .eq("cohort_id", cohortId)
    .order("name");

  const defMax = getDefaultSectionMaxStudents();
  const sectionRows = await Promise.all(
    (sections ?? []).map(async (s) => {
      const sid = s.id as string;
      const { count } = await supabase
        .from("section_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("section_id", sid)
        .eq("status", "active");
      const max = (s.max_students as number | null) ?? defMax;
      return {
        id: sid,
        name: s.name as string,
        active: count ?? 0,
        max,
      };
    }),
  );

  const sectionIds = sectionRows.map((r) => r.id);
  let distinctActiveStudents = 0;
  if (sectionIds.length > 0) {
    const { data: enr } = await supabase
      .from("section_enrollments")
      .select("student_id")
      .in("section_id", sectionIds)
      .eq("status", "active");
    distinctActiveStudents = new Set(
      (enr ?? []).map((e) => (e as { student_id: string }).student_id),
    ).size;
  }

  const { data: allSectionsRaw } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id, academic_cohorts(name)")
    .order("name");

  const targetOptions =
    (allSectionsRaw ?? []).map((raw) => {
      const r = raw as {
        id: string;
        name: string;
        cohort_id: string;
        academic_cohorts: { name: string } | { name: string }[] | null;
      };
      const c = r.academic_cohorts;
      const cn = Array.isArray(c) ? (c[0]?.name ?? "") : (c?.name ?? "");
      return {
        id: r.id,
        label: `${cn} — ${r.name}`,
        cohortId: r.cohort_id,
      };
    }) ?? [];

  const sourceSectionOptions = sectionRows.map((r) => ({ id: r.id, name: r.name }));

  const { data: teacherRows } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("role", "teacher")
    .order("last_name", { ascending: true });

  const teachers =
    (teacherRows ?? []).map((p) => {
      const r = p as { id: string; first_name: string; last_name: string };
      return {
        id: r.id,
        label: `${r.first_name} ${r.last_name}`.trim(),
      };
    });

  const { data: otherCohorts } = await supabase
    .from("academic_cohorts")
    .select("id, name")
    .neq("id", cohortId)
    .order("created_at", { ascending: false });

  const copySourceOptions =
    (otherCohorts ?? []).map((c) => ({
      id: c.id as string,
      label: c.name as string,
    })) ?? [];

  return (
    <div className="space-y-8">
      <div className="min-w-0">
        <Link
          href={`/${locale}/dashboard/admin/academic`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.backHub}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{cohort.name as string}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {(cohort.starts_on as string | null) ?? "—"} → {(cohort.ends_on as string | null) ?? "—"}
        </p>
      </div>

      <section className="grid gap-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {d.kpiStudents}
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]">{distinctActiveStudents}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {d.kpiSections}
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]">{sectionRows.length}</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">{d.sectionsTitle}</h2>
          <CohortSectionsToolbar
            locale={locale}
            cohortId={cohortId}
            newSectionButton={d.newSectionButton}
            newSectionModalDict={d.newSectionModal}
            teachers={teachers}
            copySectionsButton={d.copySectionsButton}
            copySectionsModalDict={d.copySectionsModal}
            copySectionsSourceOptions={copySourceOptions}
            rollover={{
              dict: d.rollover,
              sourceSectionOptions,
              targetSectionOptions: targetOptions,
            }}
          />
        </div>

        {sectionRows.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{d.noSections}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectionRows.map((row) => (
              <AdminSectionCard
                key={row.id}
                href={`/${locale}/dashboard/admin/academic/${cohortId}/${row.id}`}
                name={row.name}
                activeCount={row.active}
                maxStudents={row.max}
                capacityLabel={d.capacityLabel}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
