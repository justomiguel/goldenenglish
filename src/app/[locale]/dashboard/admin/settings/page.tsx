import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { loadClassRemindersAdminPageModel } from "@/lib/settings/loadClassRemindersAdminPageModel";
import { InscriptionsSettingsForm } from "@/components/dashboard/InscriptionsSettingsForm";
import { ClassRemindersAdminSettingsForm } from "@/components/dashboard/ClassRemindersAdminSettingsForm";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const enabled = await getInscriptionsEnabled();
  const classReminders = await loadClassRemindersAdminPageModel();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.settings.title}
      </h1>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {dict.admin.settings.scopeLead}
      </p>
      <InscriptionsSettingsForm
        locale={locale}
        initialEnabled={enabled}
        labels={dict.admin.settings}
      />
      {classReminders ? (
        <ClassRemindersAdminSettingsForm
          locale={locale}
          initial={classReminders}
          labels={dict.admin.settings}
        />
      ) : null}
    </div>
  );
}
