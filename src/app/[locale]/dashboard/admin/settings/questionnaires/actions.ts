"use server";

import { revalidatePath } from "next/cache";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { canPublishQuestionnaire } from "@/lib/questionnaires/canPublish";
import { pickI18nOptions } from "@/lib/questionnaires/pickI18n";
import { normalizeQuestionnaireSlug, slugFromTitle } from "@/lib/questionnaires/normalizeSlug";
import { loadAdminQuestionnaireDetail } from "@/lib/questionnaires/loadAdminQuestionnaires";
import type { QuestionnaireStatus, QuestionnaireVisibility } from "@/lib/questionnaires/types";

function revalidate(locale: string, id?: string) {
  revalidatePath(`/${locale}/dashboard/admin/settings/questionnaires`);
  revalidatePath(`/${locale}`);
  if (id) revalidatePath(`/${locale}/dashboard/admin/settings/questionnaires/${id}`);
}

export async function createQuestionnaireAction(
  locale: string,
  title: string,
): Promise<{ ok: true; id: string } | { ok: false; code: "title" | "save" }> {
  let session: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    session = await assertAdmin();
  } catch {
    logServerAuthzDenied("createQuestionnaireAction");
    return { ok: false, code: "save" };
  }
  const trimmed = title.trim();
  if (!trimmed) return { ok: false, code: "title" };
  const slug =
    slugFromTitle(trimmed) || `q-${Date.now().toString(36)}`;
  const { data, error } = await session.supabase
    .from("questionnaires")
    .insert({
      slug,
      title_i18n: { [defaultLocale]: trimmed },
      created_by: session.user.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    logSupabaseClientError("createQuestionnaireAction", error, { slug });
    return { ok: false, code: "save" };
  }
  void recordSystemAudit({
    action: "questionnaire_created",
    resourceType: "questionnaire",
    resourceId: String((data as { id: string }).id),
    payload: { slug },
  });
  revalidate(locale);
  return { ok: true, id: String((data as { id: string }).id) };
}

export async function updateQuestionnaireMetaAction(input: {
  locale: string;
  id: string;
  title: string;
  description: string;
  slug: string;
  status: QuestionnaireStatus;
  visibility: QuestionnaireVisibility;
  limitOneResponse: boolean;
  showOnLanding: boolean;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  let session: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    session = await assertAdmin();
  } catch {
    logServerAuthzDenied("updateQuestionnaireMetaAction");
    return { ok: false, code: "save" };
  }
  const title = input.title.trim();
  if (!title) return { ok: false, code: "title" };
  const detail = await loadAdminQuestionnaireDetail(session.supabase, input.id);
  if (!detail) return { ok: false, code: "save" };
  const slugParsed = normalizeQuestionnaireSlug(input.slug);
  if (!slugParsed.ok) return { ok: false, code: "slug" };
  if (detail.questionnaire.publishedAt && slugParsed.slug !== detail.questionnaire.slug) {
    return { ok: false, code: "slug" };
  }
  if (input.status === "published") {
    const gate = canPublishQuestionnaire(
      detail.questions.map((q) => ({
        questionType: q.questionType,
        options: pickI18nOptions(q.optionsI18n, defaultLocale),
        archived: Boolean(q.archivedAt),
      })),
    );
    if (!gate.ok) return { ok: false, code: gate.code === "no_questions" ? "publish_empty" : "publish_options" };
  }
  const publishedAt =
    input.status === "published"
      ? detail.questionnaire.publishedAt ?? new Date().toISOString()
      : detail.questionnaire.publishedAt;
  const { error } = await session.supabase
    .from("questionnaires")
    .update({
      title_i18n: { ...detail.questionnaire.titleI18n, [defaultLocale]: title },
      description_i18n: { ...detail.questionnaire.descriptionI18n, [defaultLocale]: input.description.trim() },
      slug: slugParsed.slug,
      status: input.status,
      visibility: input.visibility,
      limit_one_response: input.limitOneResponse,
      show_on_landing: input.showOnLanding,
      published_at: publishedAt,
    })
    .eq("id", input.id);
  if (error) {
    if (error.code === "23505") return { ok: false, code: "slug_taken" };
    logSupabaseClientError("updateQuestionnaireMetaAction", error, { id: input.id });
    return { ok: false, code: "save" };
  }
  void recordSystemAudit({
    action: "questionnaire_updated",
    resourceType: "questionnaire",
    resourceId: input.id,
    payload: { status: input.status },
  });
  revalidate(input.locale, input.id);
  revalidatePath(`/${input.locale}/q/${slugParsed.slug}`);
  return { ok: true };
}

export async function archiveQuestionnaireAction(
  locale: string,
  id: string,
): Promise<{ ok: boolean }> {
  let session: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    session = await assertAdmin();
  } catch {
    logServerAuthzDenied("archiveQuestionnaireAction");
    return { ok: false };
  }
  const { error } = await session.supabase
    .from("questionnaires")
    .update({ archived_at: new Date().toISOString(), show_on_landing: false })
    .eq("id", id);
  if (error) {
    logSupabaseClientError("archiveQuestionnaireAction", error, { id });
    return { ok: false };
  }
  void recordSystemAudit({
    action: "questionnaire_archived",
    resourceType: "questionnaire",
    resourceId: id,
  });
  revalidate(locale, id);
  return { ok: true };
}
