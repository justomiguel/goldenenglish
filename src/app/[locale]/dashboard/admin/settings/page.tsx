import { getDictionary } from "@/lib/i18n/dictionaries";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { loadClassRemindersAdminPageModel } from "@/lib/settings/loadClassRemindersAdminPageModel";
import { InscriptionsSettingsForm } from "@/components/dashboard/InscriptionsSettingsForm";
import { ClassRemindersAdminSettingsForm } from "@/components/dashboard/ClassRemindersAdminSettingsForm";
import { GoogleTranslateSettingsForm } from "@/components/dashboard/admin/settings/GoogleTranslateSettingsForm";
import { createClient } from "@/lib/supabase/server";
import {
  loadGoogleTranslateCredentials,
  maskGoogleApiKey,
} from "@/lib/blog/integrations/google/loadGoogleTranslateCredentials";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.admin.settings.title);
}

export default async function AdminSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const enabled = await getInscriptionsEnabled();
  const classReminders = await loadClassRemindersAdminPageModel();
  const supabase = await createClient();
  const googleCredentials = await loadGoogleTranslateCredentials(supabase);

  return (
    <div>
      <h1
        className="mb-6 text-2xl font-bold text-[var(--color-secondary)]"
        data-tour={ADMIN_TOUR_ANCHORS.settingsTitle}
      >
        {dict.admin.settings.title}
      </h1>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {dict.admin.settings.scopeLead}
      </p>
      <div data-tour={ADMIN_TOUR_ANCHORS.settingsInscriptions}>
        <InscriptionsSettingsForm
          locale={locale}
          initialEnabled={enabled}
          labels={dict.admin.settings}
        />
      </div>
      {classReminders ? (
        <div data-tour={ADMIN_TOUR_ANCHORS.settingsClassReminders}>
          <ClassRemindersAdminSettingsForm
            locale={locale}
            initial={classReminders}
            labels={dict.admin.settings}
          />
        </div>
      ) : null}
      <div data-tour={ADMIN_TOUR_ANCHORS.settingsBlogTranslate}>
        <GoogleTranslateSettingsForm
          locale={locale}
          labels={dict.admin.settings.blogTranslate}
          initialMaskedKey={maskGoogleApiKey(googleCredentials.apiKey)}
        />
      </div>
    </div>
  );
}
