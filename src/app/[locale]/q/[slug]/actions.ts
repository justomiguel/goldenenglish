"use server";

import { createClient } from "@/lib/supabase/server";
import { locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { submitQuestionnaireResponse } from "@/lib/questionnaires/submitQuestionnaireResponse";
import type { QuestionnaireAnswerInput, QuestionnaireSubmitCode } from "@/lib/questionnaires/types";

export async function submitPublicQuestionnaireAction(input: {
  locale: string;
  slug: string;
  guestEmail: string;
  answers: Record<string, QuestionnaireAnswerInput | undefined>;
}): Promise<{ ok: true } | { ok: false; code: QuestionnaireSubmitCode }> {
  const locale = (locales.includes(input.locale as AppLocale) ? input.locale : "es") as AppLocale;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return submitQuestionnaireResponse({
    slug: input.slug,
    locale,
    userId: user?.id ?? null,
    guestEmail: input.guestEmail,
    answers: input.answers,
  });
}
