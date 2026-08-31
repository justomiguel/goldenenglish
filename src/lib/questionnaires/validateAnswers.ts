import { pickI18nOptions } from "@/lib/questionnaires/pickI18n";
import { normalizeRespondentEmail } from "@/lib/questionnaires/hasExistingResponse";
import type {
  QuestionnaireAnswerInput,
  QuestionnaireAnswerRow,
  QuestionnaireQuestion,
  QuestionnaireSubmitCode,
} from "@/lib/questionnaires/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidateAnswersResult =
  | { ok: true; rows: QuestionnaireAnswerRow[] }
  | { ok: false; code: Extract<QuestionnaireSubmitCode, "validation" | "invalid_option"> };

type ParseAnswerResult =
  | { ok: true; row: QuestionnaireAnswerRow }
  | { ok: false; code: Extract<QuestionnaireSubmitCode, "validation" | "invalid_option"> };

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function isFilled(input: QuestionnaireAnswerInput | undefined): boolean {
  if (!input) return false;
  if (input.valueText != null && String(input.valueText).trim() !== "") return true;
  if (input.valueNumber != null && Number.isFinite(input.valueNumber)) return true;
  if (input.valueOptions && input.valueOptions.length > 0) return true;
  return false;
}

export function validateQuestionnaireAnswers(input: {
  locale: string;
  questions: ReadonlyArray<QuestionnaireQuestion>;
  answers: Record<string, QuestionnaireAnswerInput | undefined>;
}): ValidateAnswersResult {
  const rows: QuestionnaireAnswerRow[] = [];
  for (const question of input.questions) {
    if (question.archivedAt) continue;
    const raw = input.answers[question.id];
    if (!isFilled(raw)) {
      if (question.required) return { ok: false, code: "validation" };
      continue;
    }
    const parsed = parseAnswer(question, raw!, input.locale);
    if (!parsed.ok) return parsed;
    rows.push(parsed.row);
  }
  return { ok: true, rows };
}

function parseAnswer(
  question: QuestionnaireQuestion,
  raw: QuestionnaireAnswerInput,
  locale: string,
): ParseAnswerResult {
  const options = pickI18nOptions(question.optionsI18n, locale);
  switch (question.questionType) {
    case "text":
    case "textarea": {
      const valueText = String(raw.valueText ?? "").trim();
      if (!valueText) return { ok: false, code: "validation" };
      return { ok: true, row: { questionId: question.id, valueText } };
    }
    case "email": {
      const valueText = normalizeRespondentEmail(raw.valueText);
      if (!valueText || !EMAIL_RE.test(valueText)) return { ok: false, code: "validation" };
      return { ok: true, row: { questionId: question.id, valueText } };
    }
    case "phone": {
      const valueText = String(raw.valueText ?? "").trim();
      if (digitsOnly(valueText).length < 6) return { ok: false, code: "validation" };
      return { ok: true, row: { questionId: question.id, valueText } };
    }
    case "date": {
      const valueText = String(raw.valueText ?? "").trim();
      if (!DATE_RE.test(valueText)) return { ok: false, code: "validation" };
      return { ok: true, row: { questionId: question.id, valueText } };
    }
    case "yes_no": {
      const valueText = String(raw.valueText ?? "").trim();
      if (valueText !== "yes" && valueText !== "no") return { ok: false, code: "validation" };
      return { ok: true, row: { questionId: question.id, valueText } };
    }
    case "single_choice": {
      const valueText = String(raw.valueText ?? "").trim();
      if (!options.includes(valueText)) return { ok: false, code: "invalid_option" };
      return { ok: true, row: { questionId: question.id, valueText } };
    }
    case "multi_choice": {
      const valueOptions = (raw.valueOptions ?? []).map((o) => String(o).trim()).filter(Boolean);
      if (valueOptions.length === 0) return { ok: false, code: "validation" };
      if (valueOptions.some((o) => !options.includes(o))) return { ok: false, code: "invalid_option" };
      return { ok: true, row: { questionId: question.id, valueOptions } };
    }
    case "number": {
      if (typeof raw.valueNumber !== "number" || !Number.isFinite(raw.valueNumber)) {
        return { ok: false, code: "validation" };
      }
      return { ok: true, row: { questionId: question.id, valueNumber: raw.valueNumber } };
    }
    case "scale": {
      const n = raw.valueNumber;
      if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 5) {
        return { ok: false, code: "validation" };
      }
      return { ok: true, row: { questionId: question.id, valueNumber: n } };
    }
    default:
      return { ok: false, code: "validation" };
  }
}

export function isValidGuestEmail(email: string): boolean {
  const normalized = normalizeRespondentEmail(email);
  return Boolean(normalized && EMAIL_RE.test(normalized));
}
