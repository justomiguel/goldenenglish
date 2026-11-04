"use client";

import { useRef, useState } from "react";
import { GenericSlotLead } from "@/components/organisms/generic-landing/GenericSlotLead";
import type { Dictionary } from "@/types/i18n";
import styles from "./colegioDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["colegio2"];

export function ColegioDosLife({
  copy,
  sectionLabels,
  sections,
}: {
  copy: Copy;
  sectionLabels: Dictionary["landing"]["genericSectionLabels"];
  sections: Copy["sections"];
}) {
  const track = useRef<HTMLDivElement>(null);
  const [projectId, setProjectId] = useState(copy.projects[0]?.id ?? "");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const project = copy.projects.find((item) => item.id === projectId) ?? copy.projects[0];
  const events = copy.events.filter(
    (item) =>
      (category === "all" || item.category === category) &&
      (level === "all" || item.level === level),
  );

  return (
    <>
      <section className={styles.block}>
        <div className="mb-4 flex gap-3">
          <button type="button" className={styles.ghost} aria-label={copy.prev} onClick={() => track.current?.scrollBy({ left: -320, behavior: "smooth" })}>
            {copy.prev}
          </button>
          <button type="button" className={styles.ghost} aria-label={copy.next} onClick={() => track.current?.scrollBy({ left: 320, behavior: "smooth" })}>
            {copy.next}
          </button>
        </div>
        <div ref={track} className={styles.track}>
          {copy.projects.map((item) => (
            <button key={item.id} type="button" className={styles.card} onClick={() => setProjectId(item.id)}>
              <h3 className="text-3xl tracking-tight">{item.name}</h3>
            </button>
          ))}
        </div>
        {project ? <p className="mt-6 max-w-xl text-2xl tracking-tight">{project.line}</p> : null}
      </section>
      <section className={styles.block}>
        {copy.life.map((item, index) => (
          <article key={item.name} className={index === 1 ? "py-8 pl-[10vw]" : "border-t border-[var(--color-border)] py-8"}>
            <h2 className="text-4xl tracking-tight">{item.name}</h2>
            <p className="mt-2 max-w-xl">{item.line}</p>
          </article>
        ))}
      </section>
      <section id="niveles" className={styles.block}>
        <GenericSlotLead section="niveles" title={sectionLabels.niveles} body={sections.niveles} />
        <h2 className="text-4xl tracking-tight">{copy.eventsTitle}</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <Filter active={category === "all"} label={copy.all} onClick={() => setCategory("all")} />
          {copy.categories.map((item) => (
            <Filter key={item.id} active={category === item.id} label={item.label} onClick={() => setCategory(item.id)} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Filter active={level === "all"} label={copy.all} onClick={() => setLevel("all")} />
          {copy.eventLevels.map((item) => (
            <Filter key={item.id} active={level === item.id} label={item.label} onClick={() => setLevel(item.id)} />
          ))}
        </div>
        <ul className="mt-8">
          {events.map((item) => (
            <li key={item.title} className="grid gap-1 border-t border-[var(--color-border)] py-4 md:grid-cols-3">
              <span>{item.when}</span>
              <span>{item.title}</span>
              <span className="text-[var(--color-muted-foreground)]">{item.category}</span>
            </li>
          ))}
        </ul>
        <h2 className="mt-12 text-3xl">{copy.faqTitle}</h2>
        {copy.faqs.map((item) => (
          <details key={item.q} className={styles.faq}>
            <summary className="min-h-11 cursor-pointer text-lg">{item.q}</summary>
            <p className="pb-3 text-[var(--color-muted-foreground)]">{item.a}</p>
          </details>
        ))}
      </section>
      <section id="equipo" className={styles.block}>
        {copy.teachers.map((teacher) => (
          <article key={teacher.name} className="border-t border-[var(--color-border)] py-8">
            <p className="text-[var(--color-primary)]">{teacher.role}</p>
            <h2 className="text-4xl tracking-tight">{teacher.name}</h2>
            <p className="mt-2 max-w-xl">{teacher.line}</p>
          </article>
        ))}
      </section>
      <section id="certificaciones" className={styles.block}>
        <GenericSlotLead section="certificaciones" title={sectionLabels.certificaciones} body={sections.certificaciones} />
        <h2 className="text-4xl tracking-tight">{copy.stepsTitle}</h2>
        <p className="mt-3 max-w-xl text-[var(--color-muted-foreground)]">{copy.demoNote}</p>
        {copy.steps.map((step) => (
          <article key={step.n} className="mt-6 grid gap-2 border-t border-[var(--color-border)] pt-4 md:grid-cols-[4rem_1fr]">
            <p className="text-3xl text-[var(--color-primary)]">{step.n}</p>
            <div>
              <h3 className="text-2xl">{step.title}</h3>
              <p className="mt-1">{step.line}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function Filter({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 border-b px-1 text-sm font-semibold ${
        active ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent"
      }`}
    >
      {label}
    </button>
  );
}
