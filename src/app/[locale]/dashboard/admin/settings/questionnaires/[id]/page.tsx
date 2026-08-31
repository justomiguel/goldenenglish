import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadAdminQuestionnaireDetail } from "@/lib/questionnaires/loadAdminQuestionnaires";
import { QuestionnaireEditorShell } from "@/components/dashboard/admin/questionnaires/QuestionnaireEditorShell";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.admin.questionnaires.editorTitle);
}

export default async function AdminQuestionnaireEditorPage({ params }: PageProps) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const detail = await loadAdminQuestionnaireDetail(supabase, id);
  if (!detail || detail.questionnaire.archivedAt) notFound();
  return (
    <QuestionnaireEditorShell
      locale={locale}
      questionnaire={detail.questionnaire}
      questions={detail.questions}
      labels={dict.admin.questionnaires}
    />
  );
}
