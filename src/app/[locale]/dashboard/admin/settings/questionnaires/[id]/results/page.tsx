import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadAdminQuestionnaireDetail } from "@/lib/questionnaires/loadAdminQuestionnaires";
import { loadQuestionnaireResults } from "@/lib/questionnaires/loadQuestionnaireResults";
import { QuestionnaireResultsScreen } from "@/components/dashboard/admin/questionnaires/QuestionnaireResultsScreen";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.admin.questionnaires.resultsTitle);
}

export default async function AdminQuestionnaireResultsPage({ params }: PageProps) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const detail = await loadAdminQuestionnaireDetail(supabase, id);
  if (!detail) notFound();
  const model = await loadQuestionnaireResults(
    supabase,
    id,
    locale,
    dict.admin.questionnaires.anonymous,
  );
  return (
    <QuestionnaireResultsScreen
      locale={locale}
      questionnaire={detail.questionnaire}
      model={model}
      labels={dict.admin.questionnaires}
    />
  );
}
