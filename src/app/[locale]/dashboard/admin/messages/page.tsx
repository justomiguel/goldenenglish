import type { Metadata } from "next";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminMessagesTabs } from "@/components/dashboard/AdminMessagesTabs";
import { AdminPortalMessagesFilters } from "@/components/dashboard/AdminPortalMessagesFilters";
import { loadAdminPortalMessagesMailbox } from "@/lib/dashboard/loadAdminPortalMessagesMailbox";
import { loadAdminPortalMessageRecipients } from "@/lib/dashboard/loadAdminPortalMessageRecipients";

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
  const recipients = await loadAdminPortalMessageRecipients(admin, user.id);

  const composeHref = `/${locale}/dashboard/admin/messages/compose`;

  const filtersActive = Boolean(participantId || contactFormOnly);
  const emptyListLabel = filtersActive ? dict.admin.messages.emptyFiltered : undefined;

  return (
    <div>
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="min-w-0 text-2xl font-bold text-[var(--color-secondary)]">
            {dict.admin.messages.title}
          </h1>
          <Link
            href={composeHref}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] shadow-sm transition-colors hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            title={dict.admin.messages.writeMessageCtaTitle}
          >
            <PenLine className="h-4 w-4 shrink-0" aria-hidden />
            {dict.admin.messages.writeMessageCta}
          </Link>
        </div>
        <p className="w-full max-w-none text-[var(--color-muted-foreground)]">{dict.admin.messages.lead}</p>
      </header>

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
