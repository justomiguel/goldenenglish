import type {
  I18nMap,
  I18nOptionsMap,
  QuestionnaireQuestion,
  QuestionnaireQuestionType,
  QuestionnaireRecord,
  QuestionnaireStatus,
  QuestionnaireVisibility,
} from "@/lib/questionnaires/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asI18nMap(value: unknown): I18nMap {
  const out: I18nMap = {};
  for (const [key, raw] of Object.entries(asRecord(value))) {
    if (typeof raw === "string") out[key] = raw;
  }
  return out;
}

export function asI18nOptionsMap(value: unknown): I18nOptionsMap {
  const out: I18nOptionsMap = {};
  for (const [key, raw] of Object.entries(asRecord(value))) {
    if (Array.isArray(raw)) out[key] = raw.map((item) => String(item));
  }
  return out;
}

export function mapQuestionnaire(row: Record<string, unknown>): QuestionnaireRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    titleI18n: asI18nMap(row.title_i18n),
    descriptionI18n: asI18nMap(row.description_i18n),
    status: row.status as QuestionnaireStatus,
    visibility: row.visibility as QuestionnaireVisibility,
    limitOneResponse: Boolean(row.limit_one_response),
    showOnLanding: Boolean(row.show_on_landing),
    publishedAt: row.published_at ? String(row.published_at) : null,
    archivedAt: row.archived_at ? String(row.archived_at) : null,
  };
}

export function mapQuestion(row: Record<string, unknown>): QuestionnaireQuestion {
  return {
    id: String(row.id),
    questionType: row.question_type as QuestionnaireQuestionType,
    promptI18n: asI18nMap(row.prompt_i18n),
    helpTextI18n: asI18nMap(row.help_text_i18n),
    optionsI18n: asI18nOptionsMap(row.options_i18n),
    required: Boolean(row.required),
    position: Number(row.position ?? 0),
    archivedAt: row.archived_at ? String(row.archived_at) : null,
  };
}
