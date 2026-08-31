import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadAdminQuestionnaireList } from "@/lib/questionnaires/loadAdminQuestionnaires";
import { QuestionnaireAdminListScreen } from "@/components/dashboard/admin/questionnaires/QuestionnaireAdminListScreen";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.admin.questionnaires.listTitle);
}

export default async function AdminQuestionnairesPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const rows = await loadAdminQuestionnaireList(supabase, locale);
  return (
    <QuestionnaireAdminListScreen locale={locale} rows={rows} labels={dict.admin.questionnaires} />
  );
}
