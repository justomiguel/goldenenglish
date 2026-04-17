import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import type { TeacherFeedRow } from "@/components/teacher/TeacherMessagesFeed";
import type { MessagingRecipient } from "@/types/messaging";
import { TeacherMessagesEntry } from "@/components/teacher/TeacherMessagesEntry";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TeacherMessagesPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) redirect(`/${locale}/dashboard`);

  const { data: people } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .neq("id", user.id)
    .in("role", ["student", "parent", "teacher", "admin"])
    .order("role", { ascending: true })
    .order("last_name", { ascending: true });

  const recipients: MessagingRecipient[] = (people ?? []).map((p) => ({
    id: p.id as string,
    first_name: p.first_name as string,
    last_name: p.last_name as string,
    role: p.role as string,
  }));

  const { data: msgs } = await supabase
    .from("portal_messages")
    .select("id, sender_id, recipient_id, body_html, created_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(300);

  const ids = new Set<string>();
  for (const m of msgs ?? []) {
    ids.add(m.sender_id as string);
    ids.add(m.recipient_id as string);
  }
  const idList = [...ids];
  const { data: profiles } = idList.length
    ? await supabase.from("profiles").select("id, first_name, last_name, role").in("id", idList)
    : { data: [] as { id: string; first_name: string; last_name: string; role: string }[] };

  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        name: `${p.first_name} ${p.last_name}`.trim(),
        role: p.role as "student" | "parent" | "teacher" | "admin",
      },
    ]),
  );

  const feedRows: TeacherFeedRow[] = (msgs ?? []).map((m) => {
    const outgoing = (m.sender_id as string) === user.id;
    const peerId = outgoing ? (m.recipient_id as string) : (m.sender_id as string);
    const meta = profileById.get(peerId);
    const peerRole = meta?.role ?? "student";
    const peerName = meta?.name ?? dict.common.emptyValue;
    const canReply = !outgoing && (peerRole === "student" || peerRole === "parent");
    return {
      id: m.id as string,
      created_at: m.created_at as string,
      body_html: m.body_html as string,
      peerName,
      peerRole,
      isOutgoing: outgoing,
      canReply,
    };
  });

  return (
    <TeacherMessagesEntry
      locale={locale}
      title={dict.dashboard.teacher.messagesTitle}
      lead={dict.dashboard.teacher.messagesLead}
      feedRows={feedRows}
      recipients={recipients}
      labels={dict.dashboard.teacher}
    />
  );
}
