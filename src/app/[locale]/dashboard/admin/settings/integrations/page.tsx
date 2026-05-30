import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import {
  loadGoogleTranslateCredentials,
  maskGoogleApiKey,
} from "@/lib/blog/integrations/google/loadGoogleTranslateCredentials";
import { GoogleTranslateSettingsForm } from "@/components/dashboard/admin/settings/GoogleTranslateSettingsForm";

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
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.settings.integrationsTitle}
      </h1>
      <GoogleTranslateSettingsForm
        locale={locale}
        labels={dict.admin.settings.blogTranslate}
        initialMaskedKey={maskGoogleApiKey(credentials.apiKey)}
      />
    </div>
  );
}
