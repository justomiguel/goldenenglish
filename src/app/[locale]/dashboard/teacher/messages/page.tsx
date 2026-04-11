import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { TeacherMessageDto } from "@/components/teacher/TeacherMessagesClient";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "teacher") redirect(`/${locale}/dashboard`);

  const { data: msgs } = await supabase
    .from("student_messages")
    .select("id, student_id, body_html, reply_html, created_at, replied_at")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  const ids = [...new Set((msgs ?? []).map((m) => m.student_id as string))];
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", ids)
    : { data: [] as { id: string; first_name: string; last_name: string }[] };

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim()]),
  );

  const messages: TeacherMessageDto[] = (msgs ?? []).map((m) => ({
    id: m.id as string,
    studentId: m.student_id as string,
    studentName: nameById.get(m.student_id as string) ?? "—",
    body_html: m.body_html as string,
    reply_html: (m.reply_html as string | null) ?? null,
    created_at: m.created_at as string,
    replied_at: (m.replied_at as string | null) ?? null,
  }));

  return (
    <TeacherMessagesEntry
      locale={locale}
      title={dict.dashboard.teacher.messagesTitle}
      lead={dict.dashboard.teacher.messagesLead}
      messages={messages}
      labels={dict.dashboard.teacher}
    />
  );
}
