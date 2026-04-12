import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveTeacherIdForStudent } from "@/lib/messaging/resolveTeacherId";
import type { StudentMessageLineDto } from "@/components/student/StudentMessagesClient";
import { StudentMessagesEntry } from "@/components/student/StudentMessagesEntry";

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
  const canCompose = Boolean(teacherForCompose);

  const { data: raw } = await supabase
    .from("portal_messages")
    .select("id, sender_id, recipient_id, body_html, created_at")
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
        name: `${p.first_name} ${p.last_name}`.trim(),
        role: p.role as string,
      },
    ]),
  );

  const sorted = [...(raw ?? [])].sort(
    (a, b) =>
      new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime(),
  );

  const lines: StudentMessageLineDto[] = sorted.map((m) => {
    const fromMe = (m.sender_id as string) === user.id;
    const peerId = fromMe ? (m.recipient_id as string) : (m.sender_id as string);
    const peer = peerById.get(peerId);
    const peerRole = peer?.role ?? "student";
    const peerName = peer?.name ?? "—";

    let canDelete = false;
    if (fromMe && peerRole === "teacher") {
      const hasTeacherAfter = sorted.some(
        (o) =>
          (o.sender_id as string) === peerId &&
          (o.recipient_id as string) === user.id &&
          new Date(o.created_at as string) > new Date(m.created_at as string),
      );
      canDelete = !hasTeacherAfter;
    }

    let incomingLabel = dict.dashboard.student.messagesFromTeacher;
    if (peerRole === "admin") {
      incomingLabel = dict.dashboard.student.messagesFromAdmin;
    }

    return {
      id: m.id as string,
      from_me: fromMe,
      body_html: m.body_html as string,
      created_at: m.created_at as string,
      can_delete: canDelete,
      peer_name: peerName,
      incoming_label: incomingLabel,
    };
  });

  return (
    <StudentMessagesEntry
      locale={locale}
      title={dict.dashboard.student.messagesTitle}
      lead={dict.dashboard.student.messagesLead}
      lines={lines}
      canCompose={canCompose}
      labels={dict.dashboard.student}
    />
  );
}
