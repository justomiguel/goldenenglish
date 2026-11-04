import type { ReactNode } from "react";
import { GenericSlotLead } from "@/components/organisms/generic-landing/GenericSlotLead";
import type { Dictionary } from "@/types/i18n";
import styles from "./jardinDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["jardin2"];

export function JardinDosMore({
  copy,
  spaceId,
  onSpace,
  children,
  sectionLabels,
  sections,
}: {
  copy: Copy;
  spaceId: string;
  onSpace: (id: string) => void;
  children?: ReactNode;
  sectionLabels: Dictionary["landing"]["genericSectionLabels"];
  sections: Copy["sections"];
}) {
  const space = copy.spaces.find((item) => item.id === spaceId) ?? copy.spaces[0];
  return (
    <>
      <section id="modalidades" className={styles.block}>
        <GenericSlotLead section="modalidades" title={sectionLabels.modalidades} body={sections.modalidades} />
        {copy.pillars.map((item) => (
          <article key={item.n} className="grid gap-2 border-t border-[var(--color-border)] py-8 md:grid-cols-[5rem_1fr]">
            <p className="text-4xl font-semibold text-[var(--color-primary)]">{item.n}</p>
            <div>
              <h2 className="text-3xl tracking-tight">{item.title}</h2>
              <p className="mt-2 text-[var(--color-muted-foreground)]">{item.line}</p>
            </div>
          </article>
        ))}
      </section>
      {children}
      <section className={styles.block}>
        <div className="flex flex-wrap gap-3">
          {copy.spaces.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === space?.id}
              className={`min-h-11 border-b text-left text-lg ${
                item.id === space?.id ? "border-[var(--color-accent)]" : "border-transparent"
              }`}
              onClick={() => onSpace(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
        {space ? <p className="mt-6 max-w-xl text-2xl tracking-tight">{space.line}</p> : null}
      </section>
      <section id="equipo" className={styles.block}>
        {copy.teachers.map((teacher, index) => (
          <article key={teacher.name} className={index === 1 ? "py-8 pl-[8vw]" : "border-t border-[var(--color-border)] py-8"}>
            <p className="text-[var(--color-accent)]">{teacher.role}</p>
            <h2 className="text-4xl tracking-tight">{teacher.name}</h2>
            <p className="mt-2 max-w-xl">{teacher.line}</p>
          </article>
        ))}
      </section>
      <section id="certificaciones" className={`${styles.block} bg-[var(--color-surface)]`}>
        <GenericSlotLead section="certificaciones" title={sectionLabels.certificaciones} body={sections.certificaciones} />
        <h2 className="text-4xl tracking-tight">{copy.trustTitle}</h2>
        <ul className="mt-6 max-w-xl space-y-3">
          {copy.trust.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <section className={styles.block}>
        <h2 className="text-4xl tracking-tight">{copy.stepsTitle}</h2>
        {copy.steps.map((step) => (
          <article key={step.n} className="mt-6 border-t border-[var(--color-border)] pt-4">
            <p className="text-[var(--color-primary)]">{step.n}</p>
            <h3 className="text-2xl">{step.title}</h3>
            <p className="mt-1">{step.line}</p>
          </article>
        ))}
        <h2 className="mt-12 text-3xl tracking-tight">{copy.faqTitle}</h2>
        {copy.faqs.map((item) => (
          <details key={item.q} className={styles.faq}>
            <summary className="min-h-11 cursor-pointer text-lg">{item.q}</summary>
            <p className="pb-3 text-[var(--color-muted-foreground)]">{item.a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
