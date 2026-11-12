export interface MatissMarkProps {
  className?: string;
}

/** Crescent and four-point stars from the Matiss logo, drawn for the horizontal lockup. */
export function MatissMark({ className }: MatissMarkProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true" focusable="false">
      <path
        className="fill-[var(--ds-color-primary)]"
        d="M24.26 6.14A18 18 0 1 0 37.64 32.91A15 15 0 1 1 24.26 6.14Z"
      />
      <path className="fill-[var(--owned-rose)]" d="M38 4Q39 11 46 12Q39 13 38 20Q37 13 30 12Q37 11 38 4Z" />
      <path className="fill-[var(--owned-violet)]" d="M33 26Q33.5 29 36 29.5Q33.5 30 33 33Q32.5 30 30 29.5Q32.5 29 33 26Z" />
    </svg>
  );
}

export default MatissMark;
