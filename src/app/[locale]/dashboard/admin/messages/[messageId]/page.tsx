import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Reply } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { redirect, notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadAdminPortalMessageDetail } from "@/lib/dashboard/loadAdminPortalMessageDetail";
import { AdminPortalMessageDetailView } from "@/components/dashboard/AdminPortalMessageDetailView";
import { DeletePortalMessageButton } from "@/components/dashboard/DeletePortalMessageButton";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ locale: string; messageId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.admin.messages.detailMetaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPortalMessageDetailPage({ params }: PageProps) {
  const { locale, messageId } = await params;
  const dict = await getDictionary(locale);

  if (!UUID_RE.test(messageId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);

  const detail = await loadAdminPortalMessageDetail(supabase, dict, messageId);
  if (!detail) notFound();

  const listHref = `/${locale}/dashboard/admin/messages`;
  const replyHref = `/${locale}/dashboard/admin/messages/compose?replyTo=${detail.id}`;

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <Link
        href={listHref}
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        title={dict.admin.messages.composeBackToListTitle}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {dict.admin.messages.composeBackToList}
      </Link>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--color-secondary)] md:text-3xl">
        {dict.admin.messages.detailHeading}
      </h1>
      <div className="mt-7 md:mt-9">
        <AdminPortalMessageDetailView locale={locale} labels={dict.admin.messages} detail={detail} />
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-border)]/80 pt-7">
        <Link
          href={replyHref}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          title={dict.admin.messages.replyToMessageTitle}
        >
          <Reply className="h-4 w-4 shrink-0" aria-hidden />
          {dict.admin.messages.replyToMessage}
        </Link>
        <DeletePortalMessageButton
          locale={locale}
          messageId={detail.id}
          labels={dict.admin.messages}
          confirmSnippet={detail.previewSnippet || undefined}
          navigateAfterDelete="messages-list"
          messagesListHref={listHref}
        />
      </div>
    </div>
  );
}
