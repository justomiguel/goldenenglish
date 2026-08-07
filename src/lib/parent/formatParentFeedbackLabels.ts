import type { Dictionary } from "@/types/i18n";
import type { ParentFeedbackItem, ParentFeedbackSource } from "@/types/parentFeedback";

export type ParentFeedbackCopy = Dictionary["dashboard"]["parent"]["feedback"];

export type ParentFeedbackScoreLabel = {
  label: string;
  ariaLabel: string;
};

/**
 * Cohort grades store a bare `YYYY-MM-DD`; anchoring at midday keeps the rendered day
 * stable for viewers west or east of UTC.
 */
export function formatParentFeedbackDate(occurredOn: string, locale: string): string {
  if (!occurredOn) return "";
  const at = new Date(occurredOn.length <= 10 ? `${occurredOn}T12:00:00Z` : occurredOn);
  if (Number.isNaN(at.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(at);
}

export function formatParentFeedbackScore(
  item: Pick<ParentFeedbackItem, "score" | "maxScore">,
  copy: ParentFeedbackCopy,
): ParentFeedbackScoreLabel | null {
  if (item.score == null || item.maxScore == null) return null;
  const score = String(item.score);
  const max = String(item.maxScore);
  return {
    label: copy.scoreLine.replace("{score}", score).replace("{max}", max),
    ariaLabel: copy.scoreAria.replace("{score}", score).replace("{max}", max),
  };
}

export function parentFeedbackSourceLabel(
  source: ParentFeedbackSource,
  copy: ParentFeedbackCopy,
): string {
  return source === "assessment" ? copy.sourceAssessment : copy.sourceLearning;
}

/** Context / teacher / date fragments, already filtered so callers can join them directly. */
export function buildParentFeedbackMetaParts(
  item: Pick<ParentFeedbackItem, "contextLabel" | "teacherName" | "occurredOn">,
  locale: string,
  copy: ParentFeedbackCopy,
): string[] {
  return [
    item.contextLabel.trim(),
    item.teacherName?.trim() ? copy.teacherLine.replace("{teacher}", item.teacherName.trim()) : "",
    formatParentFeedbackDate(item.occurredOn, locale),
  ].filter(Boolean);
}

export function formatParentFeedbackNewSummary(
  newCount: number,
  windowDays: number,
  copy: ParentFeedbackCopy,
): string | null {
  if (newCount <= 0) return null;
  const template = newCount === 1 ? copy.newSummaryOne : copy.newSummaryMany;
  return template.replace("{count}", String(newCount)).replace("{days}", String(windowDays));
}
