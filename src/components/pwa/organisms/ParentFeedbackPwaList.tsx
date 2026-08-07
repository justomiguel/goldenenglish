"use client";

import { MessageSquareDashed } from "lucide-react";
import type { ParentFeedbackTimeline } from "@/types/parentFeedback";
import { PARENT_FEEDBACK_NEW_WINDOW_DAYS } from "@/lib/parent/buildParentFeedbackTimeline";
import {
  formatParentFeedbackNewSummary,
  type ParentFeedbackCopy,
} from "@/lib/parent/formatParentFeedbackLabels";
import { ParentFeedbackPwaRow } from "@/components/pwa/molecules/ParentFeedbackPwaRow";

export interface ParentFeedbackPwaListProps {
  locale: string;
  timeline: ParentFeedbackTimeline;
  copy: ParentFeedbackCopy;
}

/** Touch-first counterpart of `ParentFeedbackTimelineDesktop`. */
export function ParentFeedbackPwaList({ locale, timeline, copy }: ParentFeedbackPwaListProps) {
  const newSummary = formatParentFeedbackNewSummary(
    timeline.newCount,
    PARENT_FEEDBACK_NEW_WINDOW_DAYS,
    copy,
  );

  if (timeline.items.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">{copy.title}</h2>
        <div className="flex flex-col items-center gap-2 rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center">
          <MessageSquareDashed
            className="h-6 w-6 text-[var(--color-muted-foreground)]"
            aria-hidden
          />
          <p className="text-sm font-medium text-[var(--color-foreground)]">{copy.empty}</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">{copy.emptyHint}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">{copy.title}</h2>
        {newSummary ? (
          <p className="text-sm font-semibold text-[var(--color-primary)]">{newSummary}</p>
        ) : (
          <p className="text-sm text-[var(--color-muted-foreground)]">{copy.lead}</p>
        )}
      </div>
      <ul aria-label={copy.listAria} className="space-y-2">
        {timeline.items.map((item, index) => (
          <ParentFeedbackPwaRow
            key={item.id}
            item={item}
            locale={locale}
            copy={copy}
            defaultExpanded={index === 0 && item.isNew}
          />
        ))}
      </ul>
    </section>
  );
}
