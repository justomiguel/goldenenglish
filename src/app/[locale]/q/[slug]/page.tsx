import { notFound, redirect } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { pickI18n } from "@/lib/questionnaires/pickI18n";
import { hasExistingResponse } from "@/lib/questionnaires/hasExistingResponse";
import { loadPublicQuestionnaire } from "@/lib/questionnaires/loadPublicQuestionnaire";
import { QuestionnairePublicForm } from "@/components/organisms/QuestionnairePublicForm";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ done?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.admin.questionnaires.publicTitle);
}

export default async function PublicQuestionnairePage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const { done } = await searchParams;
  const dict = await getDictionary(locale);
  const labels = dict.admin.questionnaires;
  const supabase = await createClient();
  const loaded = await loadPublicQuestionnaire(supabase, slug);
  if (!loaded) notFound();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (loaded.questionnaire.visibility === "private" && !user) {
    redirect(`/${locale}/login?next=/${locale}/q/${slug}`);
  }

  let already = false;
  if (user && loaded.questionnaire.limitOneResponse) {
    const { data } = await supabase
      .from("questionnaire_responses")
      .select("respondent_user_id, respondent_email")
      .eq("questionnaire_id", loaded.questionnaire.id)
      .eq("respondent_user_id", user.id)
      .limit(1);
    already = hasExistingResponse(
      ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        respondentUserId: row.respondent_user_id ? String(row.respondent_user_id) : null,
        respondentEmail: row.respondent_email ? String(row.respondent_email) : null,
      })),
      { userId: user.id, email: null },
    );
  }

  const title = pickI18n(loaded.questionnaire.titleI18n, locale as AppLocale);
  const description = pickI18n(loaded.questionnaire.descriptionI18n, locale as AppLocale);

  return (
    <article className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-semibold">{title || labels.publicTitle}</h1>
      {description ? <p className="text-[var(--color-muted-foreground)]">{description}</p> : null}
      {done === "1" ? (
        <p className="rounded-2xl border border-[var(--color-border)] p-4">{labels.thankYou}</p>
      ) : already ? (
        <p className="rounded-2xl border border-[var(--color-border)] p-4">{labels.alreadySubmitted}</p>
      ) : (
        <QuestionnairePublicForm
          locale={locale}
          slug={slug}
          questions={loaded.questions}
          askEmail={!user && loaded.questionnaire.limitOneResponse}
          labels={labels}
        />
      )}
    </article>
  );
}
