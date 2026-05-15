import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadNeedsInitialSiteSetup } from "@/lib/site/loadNeedsInitialSiteSetup";
import { loadSiteSetupCurrentValues } from "@/lib/site/loadSiteSetupCurrentValues";
import { resolveFirstRunWizardThemeId } from "@/lib/site/resolveFirstRunWizardThemeId";
import { SiteSetupWizard } from "@/components/dashboard/admin/site-setup/SiteSetupWizard";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.siteSetup.pageTitle,
    robots: { index: false, follow: false },
  };
}

/**
 * Admin re-entry into the site setup wizard for already-configured tenants.
 * Greenfield installs still go through `/setup/first-run`; this route renders
 * the same wizard in `mode: "edit"` with the current values preloaded so
 * admins can update branding / contact / operational settings without
 * dropping back into the bootstrap flow.
 */
export default async function AdminSiteSetupPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const needsSetup = await loadNeedsInitialSiteSetup(supabase);
  if (needsSetup) {
    redirect(`/${locale}/setup/first-run`);
  }

  const themeId = await resolveFirstRunWizardThemeId();
  if (!themeId) notFound();

  const initial = await loadSiteSetupCurrentValues();

  return (
    <SiteSetupWizard
      locale={locale}
      themeId={themeId}
      mode="edit"
      initialValues={initial}
      labels={dict.dashboard.siteSetup}
      platformCredit={dict.greenfieldPublic.platformCredit}
      platformCreditAria={dict.greenfieldPublic.platformCreditAria}
    />
  );
}
