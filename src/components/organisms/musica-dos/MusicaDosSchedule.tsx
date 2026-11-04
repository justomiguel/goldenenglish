"use client";

import { useState } from "react";
import { GenericSlotLead } from "@/components/organisms/generic-landing/GenericSlotLead";
import type { Dictionary } from "@/types/i18n";
import styles from "./musicaDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["musica2"];
type ClassRow = Copy["classes"][number];

export function MusicaDosSchedule({
  copy,
  onPick,
  lead,
}: {
  copy: Copy;
  onPick: (row: ClassRow) => void;
  lead?: { title: string; body: string };
}) {
  const [instrument, setInstrument] = useState("all");
  const [level, setLevel] = useState("all");
  const [mode, setMode] = useState("all");
  const [day, setDay] = useState("all");
  const rows = copy.classes.filter(
    (row) =>
      (instrument === "all" || row.instrument === instrument) &&
      (level === "all" || row.level === level) &&
      (mode === "all" || row.mode === mode) &&
      (day === "all" || row.day === day),
  );

  return (
    <section id="niveles" className={styles.block}>
      {lead ? <GenericSlotLead section="niveles" title={lead.title} body={lead.body} /> : null}
      <h2 className="text-4xl tracking-tight">{copy.classesTitle}</h2>
      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={instrument === "all"} label={copy.all} onClick={() => setInstrument("all")} />
        {copy.instruments.map((item) => (
          <Chip key={item.id} active={instrument === item.id} label={item.name} onClick={() => setInstrument(item.id)} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={level === "all"} label={copy.all} onClick={() => setLevel("all")} />
        {copy.levels.map((item) => (
          <Chip key={item.id} active={level === item.id} label={item.label} onClick={() => setLevel(item.id)} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={mode === "all"} label={copy.all} onClick={() => setMode("all")} />
        {copy.modes.map((item) => (
          <Chip key={item.id} active={mode === item.id} label={item.label} onClick={() => setMode(item.id)} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={day === "all"} label={copy.all} onClick={() => setDay("all")} />
        {copy.days.map((item) => (
          <Chip key={item.id} active={day === item.id} label={item.label} onClick={() => setDay(item.id)} />
        ))}
      </div>
      <ul className="mt-8">
        {rows.map((row) => (
          <li key={row.id} className="grid gap-2 border-t border-[var(--color-border)] py-4 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-2xl tracking-tight">{row.title}</p>
              <p className="text-[var(--color-muted-foreground)]">{row.when}</p>
            </div>
            <button type="button" className={styles.cta} onClick={() => onPick(row)}>{copy.cta}</button>
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
