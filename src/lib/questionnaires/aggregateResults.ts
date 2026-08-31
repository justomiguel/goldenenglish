import { pickI18n, pickI18nOptions } from "@/lib/questionnaires/pickI18n";
import { NUMBER_HISTOGRAM_MIN } from "@/lib/questionnaires/types";
import type {
  QuestionnaireAnswerRow,
  QuestionnaireQuestion,
} from "@/lib/questionnaires/types";

export type ResultBar = { label: string; count: number };

export type QuestionResultBlock =
  | {
      kind: "bars";
      questionId: string;
      prompt: string;
      answeredCount: number;
      percent: number;
      bars: ResultBar[];
    }
  | {
      kind: "stats";
      questionId: string;
      prompt: string;
      answeredCount: number;
      percent: number;
      average: number;
      min: number;
      max: number;
      histogram?: ResultBar[];
    }
  | {
      kind: "list";
      questionId: string;
      prompt: string;
      answeredCount: number;
      percent: number;
      values: string[];
    };

function answersFor(
  answers: ReadonlyArray<QuestionnaireAnswerRow>,
  questionId: string,
): QuestionnaireAnswerRow[] {
  return answers.filter((row) => row.questionId === questionId);
}

function percentOf(answered: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((answered / total) * 100);
}

export function aggregateQuestionnaireResults(input: {
  locale: string;
  responseCount: number;
  questions: ReadonlyArray<QuestionnaireQuestion>;
  answers: ReadonlyArray<QuestionnaireAnswerRow>;
}): QuestionResultBlock[] {
  const ordered = [...input.questions].sort((a, b) => a.position - b.position);
  return ordered.map((question) => {
    const prompt = pickI18n(question.promptI18n, input.locale);
    const rows = answersFor(input.answers, question.id);
    const answeredCount = rows.length;
    const percent = percentOf(answeredCount, input.responseCount);
    const base = { questionId: question.id, prompt, answeredCount, percent };

    if (question.questionType === "yes_no") {
      return {
        kind: "bars",
        ...base,
        bars: [
          { label: "yes", count: rows.filter((r) => r.valueText === "yes").length },
          { label: "no", count: rows.filter((r) => r.valueText === "no").length },
        ],
      };
    }
    if (question.questionType === "scale") {
      return {
        kind: "bars",
        ...base,
        bars: [1, 2, 3, 4, 5].map((n) => ({
          label: String(n),
          count: rows.filter((r) => r.valueNumber === n).length,
        })),
      };
    }
    if (question.questionType === "single_choice" || question.questionType === "multi_choice") {
      const options = pickI18nOptions(question.optionsI18n, input.locale);
      const bars = options.map((label) => ({
        label,
        count:
          question.questionType === "multi_choice"
            ? rows.filter((r) => (r.valueOptions ?? []).includes(label)).length
            : rows.filter((r) => r.valueText === label).length,
      }));
      return { kind: "bars", ...base, bars };
    }
    if (question.questionType === "number") {
      const nums = rows
        .map((r) => r.valueNumber)
        .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
      const average = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      const min = nums.length ? Math.min(...nums) : 0;
      const max = nums.length ? Math.max(...nums) : 0;
      const block: QuestionResultBlock = {
        kind: "stats",
        ...base,
        average,
        min,
        max,
      };
      if (nums.length >= NUMBER_HISTOGRAM_MIN) {
        const span = max - min || 1;
        const buckets = 5;
        const histogram: ResultBar[] = Array.from({ length: buckets }, (_, i) => ({
          label: String(i + 1),
          count: 0,
        }));
        for (const n of nums) {
          const idx = Math.min(buckets - 1, Math.floor(((n - min) / span) * buckets));
          histogram[idx]!.count += 1;
        }
        block.histogram = histogram;
      }
      return block;
    }
    return {
      kind: "list",
      ...base,
      values: rows.map((r) => String(r.valueText ?? "")).filter(Boolean),
    };
  });
}
