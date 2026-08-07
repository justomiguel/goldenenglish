"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ParentFeedbackItem } from "@/types/parentFeedback";
import {
  buildParentFeedbackMetaParts,
  type ParentFeedbackCopy,
} from "@/lib/parent/formatParentFeedbackLabels";
import { ParentFeedbackBadges } from "@/components/molecules/ParentFeedbackBadges";

export interface ParentFeedbackPwaRowProps {
  item: ParentFeedbackItem;
  locale: string;
  copy: ParentFeedbackCopy;
  /** Recent entries open by default so the newest comment needs no extra tap. */
  defaultExpanded?: boolean;
}

/**
 * Full-width, thumb-friendly disclosure row. Collapsed it shows a two-line preview; expanded
 * it reveals the full teacher comment without leaving the list.
 */
export function ParentFeedbackPwaRow({
  item,
  locale,
  copy,
  defaultExpanded = false,
}: ParentFeedbackPwaRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = `${useId().replace(/:/g, "")}-feedback-panel`;

  return (
    <li className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={expanded ? copy.collapse : copy.expand}
        className="flex min-h-[56px] w-full items-start gap-3 px-4 py-3 text-left transition-colors active:bg-[var(--color-muted)]"
      >
        <span className="min-w-0 flex-1 space-y-1.5">
          <ParentFeedbackBadges item={item} copy={copy} />
          <span className="block truncate text-sm font-semibold text-[var(--color-foreground)]">
            {item.title}
          </span>
          <span className="block truncate text-xs text-[var(--color-muted-foreground)]">
            {buildParentFeedbackMetaParts(item, locale, copy).join(" · ")}
          </span>
          {expanded ? null : (
            <span className="line-clamp-2 block text-sm text-[var(--color-muted-foreground)]">
              {item.feedback}
            </span>
          )}
        </span>
        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-[var(--color-muted-foreground)] transition-transform motion-reduce:transition-none ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      <div id={panelId} hidden={!expanded} className="px-4 pb-4">
        <p className="border-l-2 border-[var(--color-primary)] bg-[var(--color-muted)]/40 py-2 pl-3 text-sm leading-relaxed whitespace-pre-wrap text-[var(--color-foreground)]">
          {item.feedback}
        </p>
      </div>
    </li>
  );
}
