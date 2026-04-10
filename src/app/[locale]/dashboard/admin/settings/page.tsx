import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { InscriptionsSettingsForm } from "@/components/dashboard/InscriptionsSettingsForm";

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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.settings.title}
      </h1>
      <InscriptionsSettingsForm
        locale={locale}
        initialEnabled={enabled}
        labels={dict.admin.settings}
      />
    </div>
  );
}
