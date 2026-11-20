"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import type { InstituteAnswerItem } from "@/lib/public/instituteAnswerPages";
import { postFaqMetric } from "@/variants/owned/mozarthitos/pieces/postFaqMetric";

const URL_PATTERN = /(https:\/\/[^\s]+)/g;

const OPEN_WASH = [
  "open:bg-[color-mix(in_srgb,var(--mz-pink)_10%,white)]",
  "open:bg-[color-mix(in_srgb,var(--mz-blue)_12%,white)]",
  "open:bg-[color-mix(in_srgb,var(--mz-yellow)_34%,white)]",
] as const;

function answerNodes(paragraph: string): ReactNode[] {
  return paragraph.split(URL_PATTERN).map((part, index) => {
    if (!part.startsWith("https://")) return part;
    return (
      <a
        key={`${part}-${index}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[var(--mz-header-red-deep)] underline underline-offset-4"
      >
        {part}
      </a>
    );
  });
}

interface MozarthitosFaqQuestionProps {
  item: InstituteAnswerItem;
  index: number;
  questionLevel: "h2" | "h3";
}

export function MozarthitosFaqQuestion({ item, index, questionLevel }: MozarthitosFaqQuestionProps) {
  const QuestionTag = questionLevel === "h3" ? "h3" : "h2";
  return (
    <details
      className={`group border-b border-[color-mix(in_srgb,var(--mz-header-red-deep)_16%,transparent)] px-2 last:border-b-0 ${OPEN_WASH[index % OPEN_WASH.length]}`}
      onToggle={(event) => {
        if (event.currentTarget.open) {
          postFaqMetric({ kind: "open", questionId: item.id });
        }
      }}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 py-3 text-left [&::-webkit-details-marker]:hidden">
        <span className="w-7 shrink-0 text-sm font-bold tabular-nums text-[var(--mz-header-red-deep)]" aria-hidden>
          {String(index + 1).padStart(2, "0")}
        </span>
        <QuestionTag className="min-w-0 flex-1 text-base font-semibold leading-snug text-[var(--mz-header-red-deep)] md:text-lg">
          {item.q}
        </QuestionTag>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-[var(--mz-pink)] transition-transform group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="max-w-[68ch] space-y-3 pb-4 pl-10 text-base leading-relaxed text-[var(--color-foreground)]">
        {item.a.split(/\n\n+/u).map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className="whitespace-pre-line">
            {answerNodes(paragraph)}
          </p>
        ))}
      </div>
    </details>
  );
}
