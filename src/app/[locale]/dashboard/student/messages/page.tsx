import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { StudentMessageDto } from "@/components/student/StudentMessagesClient";
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

  const { data: msgs } = await supabase
    .from("student_messages")
    .select("id, body_html, reply_html, created_at, replied_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const messages: StudentMessageDto[] = (msgs ?? []).map((m) => ({
    id: m.id as string,
    body_html: m.body_html as string,
    reply_html: (m.reply_html as string | null) ?? null,
    created_at: m.created_at as string,
    replied_at: (m.replied_at as string | null) ?? null,
  }));

  return (
    <StudentMessagesEntry
      locale={locale}
      title={dict.dashboard.student.messagesTitle}
      lead={dict.dashboard.student.messagesLead}
      messages={messages}
      labels={dict.dashboard.student}
    />
  );
}
