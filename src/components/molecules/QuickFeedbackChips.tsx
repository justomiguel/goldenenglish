"use client";

export interface QuickFeedbackChipsProps {
  chips: string[];
  onInsert: (phrase: string) => void;
  dict: { aria: string };
}

export function QuickFeedbackChips({ chips, onInsert, dict }: QuickFeedbackChipsProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label={dict.aria}>
      {chips.map((text) => (
        <button
          key={text}
          type="button"
          className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/80"
          onClick={() => onInsert(text)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
