import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import {
  loadGoogleTranslateCredentials,
  maskGoogleApiKey,
} from "@/lib/blog/integrations/google/loadGoogleTranslateCredentials";
import { GoogleTranslateSettingsForm } from "@/components/dashboard/admin/settings/GoogleTranslateSettingsForm";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminSettingsIntegrationsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const credentials = await loadGoogleTranslateCredentials(supabase);

  return (
    <div>
      <div className="mb-6">
        <AdminPageHeader
          title={dict.admin.settings.integrationsTitle}
          iconId="settings"
          tourAnchor={ADMIN_TOUR_ANCHORS.settingsIntegrationsTitle}
        />
      </div>
      <GoogleTranslateSettingsForm
        locale={locale}
        labels={dict.admin.settings.blogTranslate}
        initialMaskedKey={maskGoogleApiKey(credentials.apiKey)}
      />
    </div>
  );
}
