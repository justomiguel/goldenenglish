import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadParentChildContext } from "@/lib/parent/loadParentChildContext";
import { ParentChildDetailLayout } from "@/components/parent/ParentChildDetailLayout";
import { ParentWardProfileForm } from "@/components/parent/ParentWardProfileForm";
import { ClassReminderPrefsSection } from "@/components/molecules/ClassReminderPrefsSection";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";
import { loadStudentCareNotes } from "@/lib/students/care/loadStudentCareNotes";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; sectionId?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parent.childScreen.editTitle);
}

export default async function ParentChildEditPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const { supabase, focus } = await loadParentChildContext(locale, "/child/edit", sp);

  // resolveParentFocus only ever returns a ward this tutor is linked to, so reaching
  // here with an id means the link exists.
  const studentId = focus.studentId;
  if (!studentId) redirect(`/${locale}/dashboard/parent`);

  const { data: ward } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, birth_date")
    .eq("id", studentId)
    .single();
  if (!ward) redirect(`/${locale}/dashboard/parent`);

  const admin = createAdminClient();
  const { data: authRow } = await admin.auth.admin.getUserById(studentId);
  const wardEmail = authRow?.user?.email?.trim() ?? "";

  // The ward select above cannot reach the care columns any more (migration
  // 181), so they come through the authorized loader like everywhere else.
  const {
    data: { user: tutor },
  } = await supabase.auth.getUser();
  let care = null;
  if (tutor?.id) {
    const result = await loadStudentCareNotes(tutor.id, studentId);
    care = result.ok
      ? {
          healthNote: result.notes.healthNote,
          dietNote: result.notes.dietNote,
          supportNote: result.notes.supportNote,
        }
      : null;
  }

  const { data: crPref } = await supabase
    .from("class_reminder_channel_prefs")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  const p = dict.dashboard.parent;

  return (
    <ParentChildDetailLayout
      locale={locale}
      title={p.childScreen.editTitle}
      lead={p.childScreen.editLead}
      backLabel={p.childScreen.backToChild}
      studentId={focus.studentId}
      sectionId={focus.sectionId}
      tourAnchor={PARENT_TOUR_ANCHORS.childDetailTitle}
    >
      <div data-tour={PARENT_TOUR_ANCHORS.childDetailBody} className="space-y-8">
        <ParentWardProfileForm
          locale={locale}
          studentId={studentId}
          initial={{
            first_name: String(ward.first_name ?? ""),
            last_name: String(ward.last_name ?? ""),
            email: wardEmail,
            phone: ward.phone != null ? String(ward.phone) : null,
            birth_date: ward.birth_date != null ? String(ward.birth_date) : null,
          }}
          care={care}
          labels={p}
        />
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-secondary)]">
            {p.childClassReminderTitle}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            {p.childClassReminderHint}
          </p>
          <ClassReminderPrefsSection
            locale={locale}
            studentId={studentId}
            initial={crPref as Record<string, unknown> | null}
            labels={dict.dashboard.student}
            omitHeader
          />
        </div>
      </div>
    </ParentChildDetailLayout>
  );
}
