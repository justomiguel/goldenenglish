import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ParentSettingsEntry } from "@/components/parent/ParentSettingsEntry";
import { requirePortalPageActor } from "@/lib/dashboard/requirePortalPageActor";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.studentNav.settings);
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  await requirePortalPageActor(locale, "student");

  return (
    <ParentSettingsEntry
      locale={locale}
      labels={dict.dashboard.parent.settings}
      localeSwitcher={dict.common.locale}
    />
  );
}
