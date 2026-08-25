import type { Metadata } from "next";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminMessagesTabs } from "@/components/dashboard/AdminMessagesTabs";
import { AdminPortalMessagesFilters } from "@/components/dashboard/AdminPortalMessagesFilters";
import { AdminMessagesHeaderActions } from "@/components/dashboard/AdminMessagesHeaderActions";
import { loadAdminPortalMessagesMailbox } from "@/lib/dashboard/loadAdminPortalMessagesMailbox";
import { loadAdminPortalMessageRecipients } from "@/lib/dashboard/loadAdminPortalMessageRecipients";
import { loadMessagingDefaultReplyTemplate } from "@/lib/messaging/loadMessagingDefaultReplyTemplate";
import { MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATES } from "@/lib/messaging/messagingDefaultReplyConstants";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { AdminMessagesFolderCounts } from "@/components/dashboard/AdminMessagesFolderCounts";
import { summarizeAdminPortalMailboxCounts } from "@/lib/messaging/adminPortalMessageSource";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ participant?: string; contact?: string }>;
}

export default async function AdminMessagesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);

  const participantParsed = z.string().uuid().safeParse(sp.participant ?? "");
  const participantId = participantParsed.success ? participantParsed.data : undefined;
  const contactFormOnly = sp.contact === "1";

  const mailboxFilters =
    participantId || contactFormOnly
      ? {
          ...(participantId ? { participantId } : {}),
          ...(contactFormOnly ? { contactFormOnly: true as const } : {}),
        }
      : null;

  const { inboxRows, sentRows } = await loadAdminPortalMessagesMailbox(
    supabase,
    user.id,
    dict,
    mailboxFilters,
  );

  const admin = createAdminClient();
  const [recipients, defaultReply] = await Promise.all([
    loadAdminPortalMessageRecipients(admin, user.id),
    loadMessagingDefaultReplyTemplate(supabase, MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATES),
  ]);

  const composeHref = `/${locale}/dashboard/admin/messages/compose`;

  const filtersActive = Boolean(participantId || contactFormOnly);
  const emptyListLabel = filtersActive ? dict.admin.messages.emptyFiltered : undefined;
  const inboxCounts = summarizeAdminPortalMailboxCounts(inboxRows);

  return (
    <div>
      <AdminPageHeader
        title={dict.dashboard.adminNav.messages}
        lead={dict.dashboard.adminNav.tipMessages}
        iconId="messages"
        tourAnchor={ADMIN_TOUR_ANCHORS.messagesTitle}
        actions={
          <AdminMessagesHeaderActions
            locale={locale}
            composeHref={composeHref}
            initialTemplates={defaultReply.templates}
            labels={dict.admin.messages}
          />
        }
      />

      <AdminMessagesFolderCounts
        locale={locale}
        labels={dict.admin.messages}
        shareOfTotal={dict.admin.home.peopleStats.shareOfTotal}
        inbox={inboxCounts}
        sentTotal={sentRows.length}
      />

      <AdminPortalMessagesFilters
        key={`${participantId ?? "none"}-${contactFormOnly ? "1" : "0"}`}
        locale={locale}
        labels={dict.admin.messages}
        recipients={recipients}
        initialParticipantId={participantId}
        initialContactOnly={contactFormOnly}
      />

      <AdminMessagesTabs
        locale={locale}
        labels={dict.admin.messages}
        inboxRows={inboxRows}
        sentRows={sentRows}
        emptyListLabel={emptyListLabel}
      />
    </div>
  );
}
