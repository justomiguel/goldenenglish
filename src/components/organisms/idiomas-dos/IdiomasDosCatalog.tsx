"use client";

import { useState } from "react";
import type { Dictionary } from "@/types/i18n";
import styles from "./idiomasDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["idiomas2"];
type Course = Copy["courses"][number];

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

export function IdiomasDosCatalog({
  copy,
  onPick,
}: {
  copy: Copy;
  onPick: (course: Course) => void;
}) {
  const [language, setLanguage] = useState("all");
  const [level, setLevel] = useState("all");
  const [mode, setMode] = useState("all");
  const rows = copy.courses.filter(
    (course) =>
      (language === "all" || course.language === language) &&
      (level === "all" || course.level === level) &&
      (mode === "all" || course.mode === mode),
  );

  return (
    <section className={styles.block}>
      <h2 className="text-4xl tracking-tight">{copy.coursesTitle}</h2>
      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={language === "all"} label={copy.all} onClick={() => setLanguage("all")} />
        {copy.greetings.map((item) => (
          <Chip key={item.id} active={language === item.id} label={item.label} onClick={() => setLanguage(item.id)} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={level === "all"} label={copy.all} onClick={() => setLevel("all")} />
        {LEVELS.map((item) => (
          <Chip key={item} active={level === item} label={item} onClick={() => setLevel(item)} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={mode === "all"} label={copy.all} onClick={() => setMode("all")} />
        {copy.modes.map((item) => (
          <Chip key={item.id} active={mode === item.id} label={item.name} onClick={() => setMode(item.id)} />
        ))}
      </div>
      <ul className="mt-8">
        {rows.map((course) => (
          <li key={course.id} className="grid gap-2 border-t border-[var(--color-border)] py-4 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-2xl tracking-tight">{course.title}</p>
              <p className="text-[var(--color-muted-foreground)]">
                {course.level} · {course.when} · {course.weeks}
              </p>
            </div>
            <button type="button" className={styles.cta} onClick={() => onPick(course)}>
              {copy.cta}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={active} className={styles.chip} onClick={onClick}>
      {label}
    </button>
  );
}
