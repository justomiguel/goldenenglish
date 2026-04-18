import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { loadAdminEmailTemplates } from "@/lib/email/templates/loadAdminEmailTemplates";
import { EmailTemplatesShell } from "@/components/dashboard/admin/communications/EmailTemplatesShell";
import type { Locale } from "@/types/i18n";

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

  const entries = await loadAdminEmailTemplates(supabase);
  const brand = getBrandPublic();
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
          {dict.admin.communications.templates.title}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-muted-foreground)]">
          {dict.admin.communications.templates.lead}
        </p>
      </header>

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
