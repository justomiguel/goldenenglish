import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { TeacherSectionCard } from "@/components/molecules/TeacherSectionCard";
import { SectionEnrollmentLinkCopyButton } from "@/components/molecules/SectionEnrollmentLinkCopyButton";
import { clientAbsoluteUrl } from "@/lib/client/publicUrl";
import { buildSectionEnrollmentLinkPath } from "@/lib/register/sectionEnrollmentLinkPath";
import { sectionReferenceImagePublicUrl } from "@/lib/register/sectionReferenceImage";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { formatAcademicScheduleSummary } from "@/lib/academics/formatAcademicScheduleSummary";
import { loadTeacherSectionIdsForUser } from "@/lib/academics/loadTeacherSectionIdsForUser";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { getDashboardActor } from "@/lib/dashboard/getDashboardActor";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.teacherMySections.metaTitle);
}

export default async function TeacherSectionsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.teacherMySections;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const actor = await getDashboardActor();
  const viewerId = actor?.viewerId ?? user.id;
  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed && !actor?.viewAs) {
    const isAdmin = await resolveIsAdminSession(supabase, user.id);
    if (isAdmin) redirect(`/${locale}/dashboard/admin/academic`);
    redirect(`/${locale}/dashboard`);
  }

  const mySectionIds = await loadTeacherSectionIdsForUser(supabase, viewerId);
  const sections =
    mySectionIds.length === 0
      ? []
      : await chunkedIn<{
          id: string;
          name: string;
          cohort_id: string;
          teacher_id: string;
          schedule_slots: unknown;
          reference_image_path?: string | null;
          academic_cohorts: { name: string } | { name: string }[] | null;
        }>(
          supabase,
          "academic_sections",
          "id",
          mySectionIds,
          "id, name, cohort_id, teacher_id, schedule_slots, reference_image_path, academic_cohorts(name)",
        );
  sections.sort((a, b) => a.name.localeCompare(b.name));

  const sectionList = sections.map((r) => {
    const c = r.academic_cohorts;
    const cohortName = Array.isArray(c) ? (c[0]?.name ?? "") : (c?.name ?? "");
    return {
      id: r.id,
      name: r.name,
      cohortId: r.cohort_id,
      cohortName,
      scheduleSlots: r.schedule_slots,
      imageUrl: sectionReferenceImagePublicUrl(r.reference_image_path),
      accessRole: r.teacher_id === viewerId ? ("lead" as const) : ("assistant" as const),
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

  const linkLabels = dict.dashboard.sectionEnrollmentLink;
  const enrollmentLinksBySection = new Map<string, { token: string; is_active: boolean }>();
  const { data: linkRows } = await supabase.rpc("section_enrollment_links_for_staff");
  for (const row of linkRows ?? []) {
    const sectionId = String((row as { section_id: string }).section_id);
    enrollmentLinksBySection.set(sectionId, {
      token: String((row as { token: string }).token),
      is_active: (row as { is_active: boolean }).is_active === true,
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title={d.title} lead={d.lead} iconId="academic" />
      {sectionList.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{d.noSections}</p>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2">
          {sectionList.map((s) => {
            const link = enrollmentLinksBySection.get(s.id);
            const copyUrl =
              link?.is_active && link.token
                ? clientAbsoluteUrl(
                    buildSectionEnrollmentLinkPath(locale, s.name, link.token),
                  )
                : null;
            return (
            <li key={s.id}>
              <TeacherSectionCard
                locale={locale}
                sectionId={s.id}
                name={s.name}
                cohortName={s.cohortName}
                scheduleSummary={formatAcademicScheduleSummary(s.scheduleSlots, locale)}
                activeStudentCount={activeBySection.get(s.id) ?? 0}
                accessRole={s.accessRole}
                imageUrl={s.imageUrl}
                dict={d}
                copyLinkSlot={
                  copyUrl ? (
                    <SectionEnrollmentLinkCopyButton
                      url={copyUrl}
                      labels={{ copy: linkLabels.copy, copied: linkLabels.copied }}
                    />
                  ) : null
                }
              />
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
