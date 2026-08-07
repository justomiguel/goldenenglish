import { MessageSquareDashed } from "lucide-react";
import type { ParentFeedbackTimeline } from "@/types/parentFeedback";
import {
  PARENT_FEEDBACK_NEW_WINDOW_DAYS,
} from "@/lib/parent/buildParentFeedbackTimeline";
import {
  buildParentFeedbackMetaParts,
  formatParentFeedbackNewSummary,
  type ParentFeedbackCopy,
} from "@/lib/parent/formatParentFeedbackLabels";
import { ParentFeedbackBadges } from "@/components/molecules/ParentFeedbackBadges";

export interface ParentFeedbackTimelineDesktopProps {
  locale: string;
  timeline: ParentFeedbackTimeline;
  copy: ParentFeedbackCopy;
}

/**
 * Pointer-first reading view: everything a teacher wrote is expanded, scannable in one pass.
 * The narrow counterpart is `ParentFeedbackPwaList`.
 */
export function ParentFeedbackTimelineDesktop({
  locale,
  timeline,
  copy,
}: ParentFeedbackTimelineDesktopProps) {
  const newSummary = formatParentFeedbackNewSummary(
    timeline.newCount,
    PARENT_FEEDBACK_NEW_WINDOW_DAYS,
    copy,
  );

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">{copy.title}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{copy.lead}</p>
        {newSummary ? (
          <p className="text-sm font-semibold text-[var(--color-primary)]">{newSummary}</p>
        ) : null}
      </header>

      {timeline.items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center">
          <MessageSquareDashed
            className="h-7 w-7 text-[var(--color-muted-foreground)]"
            aria-hidden
          />
          <p className="text-sm font-medium text-[var(--color-foreground)]">{copy.empty}</p>
          <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">{copy.emptyHint}</p>
        </div>
      ) : (
        <ol
          aria-label={copy.listAria}
          className="space-y-4 border-l-2 border-[var(--color-border)] pl-6"
        >
          {timeline.items.map((item) => (
            <li key={item.id} className="relative">
              <span
                className={`absolute -left-[1.9375rem] top-5 h-3 w-3 rounded-full border-2 border-[var(--color-background)] ${
                  item.isNew ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
                }`}
                aria-hidden
              />
              <article className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
                <ParentFeedbackBadges item={item} copy={copy} />
                <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                  {item.title}
                </h3>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {buildParentFeedbackMetaParts(item, locale, copy).join(" · ")}
                </p>
                <blockquote className="border-l-2 border-[var(--color-primary)] bg-[var(--color-muted)]/40 py-2 pl-3 text-sm leading-relaxed whitespace-pre-wrap text-[var(--color-foreground)]">
                  {item.feedback}
                </blockquote>
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
