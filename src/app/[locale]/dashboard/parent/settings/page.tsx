import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ParentSettingsEntry } from "@/components/parent/ParentSettingsEntry";

export const metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ParentSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  return (
    <ParentSettingsEntry
      locale={locale}
      labels={dict.dashboard.parent.settings}
      localeSwitcher={dict.common.locale}
    />
  );
}
