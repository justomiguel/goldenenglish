import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminPortalCompose } from "@/components/dashboard/AdminPortalCompose";
import { loadAdminPortalMessageRecipients } from "@/lib/dashboard/loadAdminPortalMessageRecipients";
import { loadAdminPortalReplyComposeContext } from "@/lib/dashboard/loadAdminPortalReplyComposeContext";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ replyTo?: string }>;
}

export default async function AdminMessagesComposePage({ params, searchParams }: PageProps) {
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

  const admin = createAdminClient();
  const recipients = await loadAdminPortalMessageRecipients(admin, user.id);

  const replyTo = typeof sp.replyTo === "string" ? sp.replyTo : undefined;
  const replyBootstrap = await loadAdminPortalReplyComposeContext(supabase, user.id, replyTo);

  let composeLead = dict.admin.messages.composePageLead;
  if (replyBootstrap.kind === "portal") {
    composeLead = dict.admin.messages.composePageLeadReplyPortal;
  } else if (replyBootstrap.kind === "external_email") {
    composeLead = dict.admin.messages.composePageLeadReplyExternal;
  }

  const listHref = `/${locale}/dashboard/admin/messages`;

  return (
    <div>
      <Link
        href={listHref}
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        title={dict.admin.messages.composeBackToListTitle}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {dict.admin.messages.composeBackToList}
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.messages.composePageTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-[var(--color-muted-foreground)]">{composeLead}</p>
      <div className="mt-8 max-w-3xl">
        <AdminPortalCompose
          locale={locale}
          recipients={recipients}
          labels={dict.admin.messages}
          successNavigateTo={listHref}
          replyBootstrap={replyBootstrap}
        />
      </div>
    </div>
  );
}
