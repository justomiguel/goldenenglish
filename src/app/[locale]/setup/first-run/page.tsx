import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadFirstRunWizardMode } from "@/lib/site/loadFirstRunWizardMode";
import { loadNeedsInitialSiteSetup } from "@/lib/site/loadNeedsInitialSiteSetup";
import { createClient } from "@/lib/supabase/server";
import { resolveFirstRunWizardThemeId } from "@/lib/site/resolveFirstRunWizardThemeId";
import { BootstrapAdminForm } from "@/components/dashboard/admin/site-setup/BootstrapAdminForm";
import { SiteSetupWizard } from "@/components/dashboard/admin/site-setup/SiteSetupWizard";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.siteSetup.firstRunPageTitle,
    robots: { index: false, follow: false },
  };
}

export default async function FirstRunSetupPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const mode = await loadFirstRunWizardMode();
  if (mode === "closed") {
    redirect(`/${locale}`);
  }

  if (mode === "bootstrap_account") {
    return (
      <BootstrapAdminForm
        locale={locale}
        labels={dict.dashboard.siteSetup}
        loginLabels={dict.login}
        platformCredit={dict.greenfieldPublic.platformCredit}
        platformCreditAria={dict.greenfieldPublic.platformCreditAria}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/${locale}/login?next=${encodeURIComponent(`/${locale}/setup/first-run`)}`,
    );
  }

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) {
    redirect(`/${locale}`);
  }

  const needsSetup = await loadNeedsInitialSiteSetup(supabase);
  if (!needsSetup) {
    redirect(`/${locale}/dashboard/admin`);
  }

  const themeIdResolved = await resolveFirstRunWizardThemeId();
  if (!themeIdResolved) notFound();

  return (
    <SiteSetupWizard
      locale={locale}
      themeId={themeIdResolved}
      labels={dict.dashboard.siteSetup}
      platformCredit={dict.greenfieldPublic.platformCredit}
      platformCreditAria={dict.greenfieldPublic.platformCreditAria}
    />
  );
}
