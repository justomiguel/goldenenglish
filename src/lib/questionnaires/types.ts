export const QUESTIONNAIRE_STATUSES = ["draft", "published", "closed"] as const;
export type QuestionnaireStatus = (typeof QUESTIONNAIRE_STATUSES)[number];

export const QUESTIONNAIRE_VISIBILITIES = ["public", "private"] as const;
export type QuestionnaireVisibility = (typeof QUESTIONNAIRE_VISIBILITIES)[number];

export const QUESTIONNAIRE_QUESTION_TYPES = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "yes_no",
  "single_choice",
  "multi_choice",
  "scale",
] as const;
export type QuestionnaireQuestionType = (typeof QUESTIONNAIRE_QUESTION_TYPES)[number];

export const QUESTIONNAIRE_SUBMIT_CODES = [
  "not_found",
  "closed",
  "login_required",
  "already_submitted",
  "validation",
  "invalid_option",
] as const;
export type QuestionnaireSubmitCode = (typeof QUESTIONNAIRE_SUBMIT_CODES)[number];

export type I18nMap = Record<string, string>;
export type I18nOptionsMap = Record<string, string[]>;

export interface QuestionnaireQuestion {
  id: string;
  questionType: QuestionnaireQuestionType;
  promptI18n: I18nMap;
  helpTextI18n: I18nMap;
  optionsI18n: I18nOptionsMap;
  required: boolean;
  position: number;
  archivedAt: string | null;
}

export interface QuestionnaireRecord {
  id: string;
  slug: string;
  titleI18n: I18nMap;
  descriptionI18n: I18nMap;
  status: QuestionnaireStatus;
  visibility: QuestionnaireVisibility;
  limitOneResponse: boolean;
  showOnLanding: boolean;
  publishedAt: string | null;
  archivedAt: string | null;
}

export interface QuestionnaireAnswerInput {
  valueText?: string;
  valueNumber?: number;
  valueOptions?: string[];
}

export interface QuestionnaireAnswerRow {
  questionId: string;
  valueText?: string;
  valueNumber?: number;
  valueOptions?: string[];
}

export const MAX_QUESTIONS_PER_QUESTIONNAIRE = 50;
export const MAX_OPTIONS_PER_QUESTION = 20;
export const RESULTS_PAGE_SIZE = 20;
export const NUMBER_HISTOGRAM_MIN = 8;
