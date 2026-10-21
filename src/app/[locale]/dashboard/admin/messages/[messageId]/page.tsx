import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Reply, ReplyAll } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { redirect, notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadAdminPortalMessageDetail } from "@/lib/dashboard/loadAdminPortalMessageDetail";
import { markAdminPortalMessageRead } from "@/lib/messaging/markAdminPortalMessageAttention";
import { AdminPortalMessageDetailView } from "@/components/dashboard/AdminPortalMessageDetailView";
import { DeletePortalMessageButton } from "@/components/dashboard/DeletePortalMessageButton";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

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

  await markAdminPortalMessageRead(supabase, messageId);

  const listHref = `/${locale}/dashboard/admin/messages`;
  const replyHref = `/${locale}/dashboard/admin/messages/compose?replyTo=${detail.id}`;
  const replyWithDefaultHref = `${replyHref}&useDefault=1`;

  return (
    <div className="mx-auto max-w-4xl pb-28 md:pb-10">
      <Link
        href={listHref}
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        title={dict.admin.messages.composeBackToListTitle}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {dict.admin.messages.composeBackToList}
      </Link>
      <div className="mt-5 hidden md:block">
        <AdminPageHeader
          title={dict.admin.messages.detailHeading}
          iconId="messages"
          tourAnchor={ADMIN_TOUR_ANCHORS.messagesDetailTitle}
        />
      </div>
      <div className="mt-7 md:mt-9">
        <AdminPortalMessageDetailView locale={locale} labels={dict.admin.messages} detail={detail} />
      </div>
      <div
        className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-30 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 md:static md:z-auto md:mt-8 md:gap-3 md:border-[var(--color-border)]/80 md:bg-transparent md:px-0 md:py-0 md:pt-7"
        data-tour={ADMIN_TOUR_ANCHORS.messagesDetailActions}
      >
        <Link
          href={replyHref}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          title={dict.admin.messages.replyToMessageTitle}
        >
          <Reply className="h-4 w-4 shrink-0" aria-hidden />
          {dict.admin.messages.replyToMessage}
        </Link>
        <Link
          href={replyWithDefaultHref}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          title={dict.admin.messages.replyWithDefaultMessageTitle}
        >
          <ReplyAll className="h-4 w-4 shrink-0" aria-hidden />
          {dict.admin.messages.replyWithDefaultMessage}
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
