"use client";

import { useState } from "react";
import { MATISS_AGE_RANGE, matissGroupsForAge } from "@/lib/landing/matissSchedule";

export interface MatissAgeFinderProps {
  title: string;
  lead: string;
  yearsLabel: string;
  emptyLabel: string;
  dayLabel: string;
  locationNames: Record<"sanMiguel" | "laFlorida", string>;
  groupNames: Record<string, string>;
}

export function MatissAgeFinder({
  title,
  lead,
  yearsLabel,
  emptyLabel,
  dayLabel,
  locationNames,
  groupNames,
}: MatissAgeFinderProps) {
  const [age, setAge] = useState(5);
  const groups = matissGroupsForAge(age);
  const ages = Array.from(
    { length: MATISS_AGE_RANGE.max - MATISS_AGE_RANGE.min + 1 },
    (_, index) => MATISS_AGE_RANGE.min + index,
  );

  return (
    <div>
      <h2 className="matiss-display text-4xl text-[var(--matiss-ink)] md:text-5xl">{title}</h2>
      <p className="mt-3 max-w-xl text-[var(--matiss-ink-soft)]">{lead}</p>
      <div role="radiogroup" aria-label={title} className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {ages.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={value === age}
            onClick={() => setAge(value)}
            className={`inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full px-3 text-sm font-semibold ${
              value === age
                ? "bg-[var(--matiss-violet-deep)] text-white"
                : "bg-white text-[var(--matiss-ink)] hover:bg-[var(--matiss-lavender)]"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      {groups.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--matiss-ink-soft)]">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <li key={group.id} className="rounded-2xl bg-white p-5">
              <p className="text-sm font-semibold text-[var(--matiss-rose-deep)]">{locationNames[group.location]}</p>
              <p className="matiss-display mt-1 text-2xl text-[var(--matiss-ink)]">{groupNames[group.id]}</p>
              <p className="mt-2 text-sm text-[var(--matiss-ink-soft)]">
                {dayLabel} · {group.start}–{group.end} · {group.ageMin}–{group.ageMax} {yearsLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
