import { ClipboardCheck, GraduationCap, Sparkles } from "lucide-react";
import type { ParentFeedbackItem } from "@/types/parentFeedback";
import {
  formatParentFeedbackScore,
  parentFeedbackSourceLabel,
  type ParentFeedbackCopy,
} from "@/lib/parent/formatParentFeedbackLabels";

export interface ParentFeedbackBadgesProps {
  item: ParentFeedbackItem;
  copy: ParentFeedbackCopy;
}

const CHIP =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold leading-tight";

/**
 * Source / recency / score chips shared by the desktop timeline and the PWA list, so both
 * surfaces stay visually and semantically aligned while their layouts differ.
 */
export function ParentFeedbackBadges({ item, copy }: ParentFeedbackBadgesProps) {
  const SourceIcon = item.source === "assessment" ? GraduationCap : ClipboardCheck;
  const score = formatParentFeedbackScore(item, copy);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`${CHIP} border border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]`}
      >
        <SourceIcon className="h-3 w-3 shrink-0" aria-hidden />
        {parentFeedbackSourceLabel(item.source, copy)}
      </span>
      {item.isNew ? (
        <span
          className={`${CHIP} border border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]`}
        >
          <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
          {copy.newBadge}
        </span>
      ) : null}
      {score ? (
        <span
          className={`${CHIP} border border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-[var(--color-foreground)]`}
          aria-label={score.ariaLabel}
        >
          {score.label}
        </span>
      ) : null}
    </div>
  );
}
