import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { AdminMessageRow } from "@/components/dashboard/AdminMessagesInbox";
import { AdminMessagesTabs } from "@/components/dashboard/AdminMessagesTabs";
import { AdminPortalCompose } from "@/components/dashboard/AdminPortalCompose";
import type { MessagingRecipient } from "@/types/messaging";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

function stripPreview(html: string, max = 120): string {
  const text = String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function roleLabel(
  dict: Awaited<ReturnType<typeof getDictionary>>,
  role: string,
): string {
  if (role === "student") return dict.admin.messages.roleStudent;
  if (role === "parent") return dict.admin.messages.roleParent;
  if (role === "teacher") return dict.admin.messages.roleTeacher;
  if (role === "admin") return dict.admin.messages.roleAdmin;
  return role || dict.common.emptyValue;
}

function buildRow(
  m: {
    id: unknown;
    sender_id: unknown;
    recipient_id: unknown;
    body_html: unknown;
    created_at: unknown;
  },
  dict: Awaited<ReturnType<typeof getDictionary>>,
  metaById: Map<string, { name: string; role: string }>,
): AdminMessageRow {
  const s = metaById.get(m.sender_id as string);
  const r = metaById.get(m.recipient_id as string);
  return {
    id: m.id as string,
    fromName: s?.name ?? dict.common.emptyValue,
    toName: r?.name ?? dict.common.emptyValue,
    fromRole: roleLabel(dict, s?.role ?? ""),
    toRole: roleLabel(dict, r?.role ?? ""),
    createdAt: m.created_at as string,
    preview: stripPreview(m.body_html as string),
  };
}

export default async function AdminMessagesPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);

  const admin = createAdminClient();
  const { data: people } = await admin
    .from("profiles")
    .select("id, first_name, last_name, role")
    .neq("id", user.id)
    .in("role", ["student", "parent", "teacher", "admin"])
    .order("role", { ascending: true })
    .order("last_name", { ascending: true })
    .limit(500);

  const recipients: MessagingRecipient[] = (people ?? []).map((p) => ({
    id: p.id as string,
    first_name: p.first_name as string,
    last_name: p.last_name as string,
    role: p.role as string,
  }));

  const { data: msgs } = await supabase
    .from("portal_messages")
    .select("id, sender_id, recipient_id, body_html, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const ids = new Set<string>();
  for (const m of msgs ?? []) {
    ids.add(m.sender_id as string);
    ids.add(m.recipient_id as string);
  }
  const idList = [...ids];
  const profiles = await chunkedIn<{
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  }>(supabase, "profiles", "id", idList, "id, first_name, last_name, role");

  const metaById = new Map(
    profiles.map((p) => [
      p.id,
      {
        name: formatProfileSnakeSurnameFirst(p),
        role: p.role as string,
      },
    ]),
  );

  const list = msgs ?? [];
  const allRows: AdminMessageRow[] = list.map((m) => buildRow(m, dict, metaById));

  const inboxRows: AdminMessageRow[] = list
    .filter((m) => {
      if ((m.recipient_id as string) !== user.id) return false;
      const sender = metaById.get(m.sender_id as string);
      return sender?.role === "teacher" || sender?.role === "admin";
    })
    .map((m) => buildRow(m, dict, metaById));

  const sentRows: AdminMessageRow[] = list
    .filter((m) => (m.sender_id as string) === user.id)
    .map((m) => buildRow(m, dict, metaById));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.messages.title}
      </h1>
      <p className="mt-2 max-w-2xl text-[var(--color-muted-foreground)]">
        {dict.admin.messages.lead}
      </p>
      <div className="mt-8">
        <AdminPortalCompose locale={locale} recipients={recipients} labels={dict.admin.messages} />
      </div>
      <AdminMessagesTabs
        locale={locale}
        labels={dict.admin.messages}
        inboxRows={inboxRows}
        sentRows={sentRows}
        allRows={allRows}
      />
    </div>
  );
}
