import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { MessagingRecipient } from "@/types/messaging";
import type { ParentMessageLineDto } from "@/components/parent/ParentMessagesFeed";
import { ParentMessagesEntry } from "@/components/parent/ParentMessagesEntry";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ to?: string }>;
}

export default async function ParentMessagesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
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
  if (profile?.role !== "parent") redirect(`/${locale}/dashboard`);

  const { data: rels } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", user.id);
  const studentIds = [...new Set((rels ?? []).map((r) => r.student_id as string))];

  let recipients: MessagingRecipient[] = [];
  if (studentIds.length) {
    const { data: studs } = await supabase
      .from("profiles")
      .select("assigned_teacher_id")
      .in("id", studentIds);
    const teacherIdSet = new Set<string>();
    for (const s of studs ?? []) {
      const tid = s.assigned_teacher_id as string | null;
      if (tid) teacherIdSet.add(tid);
    }
    const teacherIds = [...teacherIdSet];
    if (teacherIds.length) {
      const { data: teachers } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .in("id", teacherIds)
        .eq("role", "teacher")
        .order("last_name", { ascending: true });
      recipients = (teachers ?? []).map((t) => ({
        id: t.id as string,
        first_name: t.first_name as string,
        last_name: t.last_name as string,
        role: "teacher",
      }));
    }
  }

  const canCompose = recipients.length > 0;

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
      { name: formatProfileSnakeSurnameFirst(p), role: p.role as string },
    ]),
  );

  const sorted = [...(raw ?? [])].sort(
    (a, b) =>
      new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime(),
  );

  const lines: ParentMessageLineDto[] = sorted.map((m) => {
    const fromMe = (m.sender_id as string) === user.id;
    const peerId = fromMe ? (m.recipient_id as string) : (m.sender_id as string);
    const peer = peerById.get(peerId);
    const peerName = peer?.name ?? dict.common.emptyValue;
    const incomingLabel = dict.dashboard.parent.messagesFromTeacher;

    return {
      id: m.id as string,
      from_me: fromMe,
      body_html: m.body_html as string,
      created_at: m.created_at as string,
      peer_name: peerName,
      incoming_label: incomingLabel,
    };
  });

  const defaultRecipientId =
    typeof sp.to === "string" && recipients.some((r) => r.id === sp.to) ? sp.to : undefined;

  return (
    <ParentMessagesEntry
      locale={locale}
      title={dict.dashboard.parent.messagesTitle}
      lead={dict.dashboard.parent.messagesLead}
      lines={lines}
      recipients={recipients}
      canCompose={canCompose}
      labels={dict.dashboard.parent}
      defaultRecipientId={defaultRecipientId}
    />
  );
}
