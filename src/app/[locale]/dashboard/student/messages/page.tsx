import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveTeacherIdForStudent } from "@/lib/messaging/resolveTeacherId";
import { StudentMessagesEntry } from "@/components/student/StudentMessagesEntry";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { buildStudentPortalMessageLines } from "@/lib/student/buildStudentPortalMessageLines";
import type { RawPortalMessageRow } from "@/lib/student/buildStudentPortalMessageLines";
import { countProfilesWithRole } from "@/lib/dashboard/countProfilesWithRole";
import { loadAdminProfileIds } from "@/lib/messaging/loadAdminProfileIds";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentMessagesPage({ params }: PageProps) {
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
    .single();
  if (profile?.role !== "student") redirect(`/${locale}/dashboard`);

  const teacherForCompose = await resolveTeacherIdForStudent(supabase, user.id);
  const teacherComposeAvailable = Boolean(teacherForCompose);
  const administrationComposeAvailable = (await countProfilesWithRole("admin")) > 0;

  const { data: raw } = await supabase
    .from("portal_messages")
    .select("id, sender_id, recipient_id, body_html, created_at, broadcast_batch_id")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  const peerIds = new Set<string>();
  for (const m of raw ?? []) {
    const other =
      (m.sender_id as string) === user.id ? (m.recipient_id as string) : (m.sender_id as string);
    peerIds.add(other);
  }
  const idList = [...peerIds];
  const { data: peerProfiles } = idList.length
    ? await supabase.from("profiles").select("id, first_name, last_name, role").in("id", idList)
    : { data: [] as { id: string; first_name: string; last_name: string; role: string }[] };

  const peerById = new Map(
    (peerProfiles ?? []).map((p) => [
      p.id,
      {
        name: formatProfileSnakeSurnameFirst(p),
        role: p.role as string,
      },
    ]),
  );

  const sortedAsc: RawPortalMessageRow[] = [...(raw ?? [])].map((m) => ({
    id: m.id as string,
    sender_id: m.sender_id as string,
    recipient_id: m.recipient_id as string,
    body_html: m.body_html as string,
    created_at: m.created_at as string,
    broadcast_batch_id: (m.broadcast_batch_id as string | null) ?? null,
  }));

  sortedAsc.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const adminRecipientIds = await loadAdminProfileIds();

  const lines = buildStudentPortalMessageLines({
    userId: user.id,
    sortedAsc,
    peerById,
    adminRecipientIds,
    labels: {
      messagesFromTeacher: dict.dashboard.student.messagesFromTeacher,
      messagesFromAdmin: dict.dashboard.student.messagesFromAdmin,
      administrationPeerLabel: dict.dashboard.student.administrationPeerLabel,
      emptyValue: dict.dashboard.student.emptyValue,
    },
  });

  return (
    <StudentMessagesEntry
      locale={locale}
      title={dict.dashboard.parent.messagesTitle}
      lead={dict.dashboard.parent.messagesLead}
      lines={lines}
      teacherComposeAvailable={teacherComposeAvailable}
      administrationComposeAvailable={administrationComposeAvailable}
      labels={dict.dashboard.student}
    />
  );
}
