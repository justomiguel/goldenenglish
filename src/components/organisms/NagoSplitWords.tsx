"use client";

import { planNagoSplitWords, type NagoTitlePart } from "@/lib/landing/nagoSplitWords";

export function NagoSplitWords({
  id,
  className = "",
  parts,
}: {
  id: string;
  className?: string;
  parts: readonly NagoTitlePart[];
}) {
  const planned = planNagoSplitWords(parts);
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!planned || reduce) {
    return (
      <h1 id={id} className={className}>
        {parts.map((part, i) =>
          part.accent ? (
            <span key={i} className="nago-hero-title-accent">
              {part.text}
            </span>
          ) : (
            <span key={i}>{part.text} </span>
          ),
        )}
      </h1>
    );
  }

  return (
    <h1 id={id} className={className} aria-label={planned.ariaLabel}>
      {planned.words.map((word, i) => (
        <span key={`${word.text}-${i}`} className="nago-split-word-clip">
          <span
            className={`nago-split-word${word.accent ? " nago-hero-title-accent" : ""}`}
            aria-hidden="true"
            style={{ animationDelay: `${word.delayIndex * 80}ms` }}
          >
            {word.text}
          </span>
        </span>
      ))}
    </h1>
  );
}
