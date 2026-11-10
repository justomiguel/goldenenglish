"use client";

import { useState } from "react";
import Image from "next/image";
import { MATISS_AGE_RANGE, matissGroupsForAge, type MatissWeekday } from "@/lib/landing/matissSchedule";

export interface MatissAgeFinderProps {
  title: string;
  lead: string;
  yearsLabel: string;
  emptyLabel: string;
  dayLabels: Record<MatissWeekday, string>;
  locationNames: Record<"sanMiguel" | "laFlorida", string>;
  groupNames: Record<string, string>;
  photoSmall: string;
  photoBig: string;
  photoAltSmall: string;
  photoAltBig: string;
}

export function MatissAgeFinder({
  title,
  lead,
  yearsLabel,
  emptyLabel,
  dayLabels,
  locationNames,
  groupNames,
  photoSmall,
  photoBig,
  photoAltSmall,
  photoAltBig,
}: MatissAgeFinderProps) {
  const [age, setAge] = useState(5);
  const groups = matissGroupsForAge(age);
  const young = age <= 7;
  const photoSrc = young ? photoSmall : photoBig;
  const photoAlt = young ? photoAltSmall : photoAltBig;
  const ages = Array.from(
    { length: MATISS_AGE_RANGE.max - MATISS_AGE_RANGE.min + 1 },
    (_, index) => MATISS_AGE_RANGE.min + index,
  );

  return (
    <div>
      <h3 className="matiss-display text-3xl text-[var(--matiss-ink)] md:text-4xl">{title}</h3>
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
      <div className="mt-6 grid items-start gap-4 md:grid-cols-[11rem_1fr]">
        <Image key={photoSrc} src={photoSrc} alt={photoAlt} width={902} height={1024} className="matiss-fade-up h-40 w-full rounded-3xl object-cover object-top md:h-52" />
        {groups.length === 0 ? (
          <p className="text-sm text-[var(--matiss-ink-soft)]">{emptyLabel}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <li key={group.id} className="rounded-2xl bg-white p-5">
              <p className="text-sm font-semibold text-[var(--matiss-rose-deep)]">{locationNames[group.location]}</p>
              <p className="matiss-display mt-1 text-2xl text-[var(--matiss-ink)]">{groupNames[group.id]}</p>
              <p className="mt-2 text-sm text-[var(--matiss-ink-soft)]">
                {dayLabels[group.day]} · {group.start}–{group.end} · {group.ageMin}–{group.ageMax} {yearsLabel}
              </p>
            </li>
          ))}
          </ul>
        )}
      </div>
    </div>
  );
}
