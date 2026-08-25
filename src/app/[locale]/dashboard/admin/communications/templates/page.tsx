import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { isEmailTemplatesMegaAdmin } from "@/lib/auth/emailTemplatesMegaAdmin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { loadAdminEmailTemplates } from "@/lib/email/templates/loadAdminEmailTemplates";
import { EmailTemplatesShell } from "@/components/dashboard/admin/communications/EmailTemplatesShell";
import type { Locale } from "@/types/i18n";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminCommunicationsTemplatesPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);
  if (!isEmailTemplatesMegaAdmin(user.email)) redirect(`/${locale}/dashboard/admin`);

  const entries = await loadAdminEmailTemplates(supabase);
  const brand = await getBrandForRequest();
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={dict.admin.communications.templates.title}
        lead={dict.admin.communications.templates.lead}
        iconId="emailTemplates"
        tourAnchor={ADMIN_TOUR_ANCHORS.emailTemplatesTitle}
      />

      <EmailTemplatesShell
        locale={locale as Locale}
        labels={dict.admin.communications.templates}
        entries={entries.map((e) => ({
          definition: e.definition,
          overridesByLocale: e.overridesByLocale,
        }))}
        brand={{
          name: brand.name,
          legalName: brand.legalName,
          logoPath: brand.logoPath,
          logoAlt: brand.logoAlt,
          contactEmail: brand.contactEmail,
          contactAddress: brand.contactAddress,
        }}
        origin={origin}
      />
    </div>
  );
}
