"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { GenericSectionPhoto, GenericSlotLead } from "@/components/organisms/generic-landing/GenericSlotLead";
import { TemplateThumbCta } from "@/components/organisms/generic-landing/TemplateThumbCta";
import { templateNavItems } from "@/lib/landing/templateSections";
import type { Dictionary } from "@/types/i18n";
import { DeportesDosForm } from "@/components/organisms/deportes-dos/DeportesDosForm";
import { DeportesDosSchedule } from "@/components/organisms/deportes-dos/DeportesDosSchedule";
import styles from "./deportesDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["deportes2"];
type ContactLabels = Dictionary["landing"]["genericContact"];

export interface DeportesDosExperienceProps {
  copy: Copy;
  locale: string;
  siteName: string;
  mailTo: string;
  contactLabels: ContactLabels;
  menu: Dictionary["landing"]["templateNav"];
  sectionLabels: Dictionary["landing"]["genericSectionLabels"];
}

export function DeportesDosExperience({
  copy,
  locale,
  siteName,
  mailTo,
  contactLabels,
  menu,
  sectionLabels,
}: DeportesDosExperienceProps) {
  const [discipline, setDiscipline] = useState(copy.disciplines[0]?.id ?? "");
  const [level, setLevel] = useState("all");
  const nav = templateNavItems(menu);

  function pick(id: string) {
    setDiscipline(id);
    setLevel("all");
    document.getElementById("contacto")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  return (
    <article className={styles.stage}>
      <header className={styles.bar}>
        <a href="#inicio">{siteName}</a>
        <nav aria-label={siteName} className={styles.nav}>
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
      </header>
      <section id="inicio" className={styles.hero}>
        <GenericSectionPhoto placement="hero" section="inicio" alt={copy.imageAlt} />
        <div className={styles.slash} aria-hidden />
        <div className="relative z-10">
          <p>{copy.scene}</p>
          <h1 className={styles.heroTitle}>
            {copy.title.split(" ").map((word, index) => (
              <span key={`${word}-${index}`} className={`${styles.word} ${index === 1 ? styles.lime : ""}`}>
                {word}
              </span>
            ))}
          </h1>
          <p className="mt-4 max-w-xl">{copy.body}</p>
          <div className={styles.actions}>
            <a className={styles.cta} href="#oferta">
              <ArrowRight className="h-4 w-4" aria-hidden />
              {copy.heroCta}
            </a>
            <a className={styles.ghost} href="#contacto">
              {copy.cta}
            </a>
          </div>
          <p className={styles.hint}>{copy.scrollHint}</p>
        </div>
      </section>
      <section id="historia" className={styles.block}>
        <GenericSlotLead section="historia" title={sectionLabels.historia} body={copy.sections.historia} />
        {copy.manifesto.map((line) => (
          <p key={line} className={styles.manifesto}>
            {line}
          </p>
        ))}
      </section>
      <section id="oferta" className={styles.rail}>
        <GenericSlotLead section="oferta" title={sectionLabels.oferta} body={copy.sections.oferta} />
        {copy.disciplines.map((item) => (
          <article key={item.id} className={styles.panel}>
            <h3>{item.name}</h3>
            <p className={`mt-3 text-lg ${styles.accent}`}>{item.line}</p>
            <p className="mt-2 max-w-md text-[var(--color-muted-foreground)]">{item.detail}</p>
            <button type="button" className={`${styles.cta} mt-6`} onClick={() => pick(item.id)}>
              {copy.cta}
            </button>
          </article>
        ))}
      </section>
      <section id="modalidades" className={styles.block}>
        <GenericSlotLead section="modalidades" title={sectionLabels.modalidades} body={copy.sections.modalidades} />
        {copy.pillars.map((item) => (
          <article key={item.n} className="grid items-end gap-3 border-t border-[var(--color-border)] py-8 md:grid-cols-[8rem_1fr]">
            <p className={styles.number}>{item.n}</p>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-2 text-[var(--color-muted-foreground)]">{item.line}</p>
            </div>
          </article>
        ))}
      </section>
      <DeportesDosSchedule
        copy={copy}
        discipline={discipline}
        level={level}
        onDiscipline={setDiscipline}
        onLevel={setLevel}
        lead={{ title: sectionLabels.niveles, body: copy.sections.niveles }}
      />
      <section id="equipo" className={styles.block}>
        {copy.coaches.map((coach) => (
          <article key={coach.name} className="border-t border-[var(--color-border)] py-8">
            <p className={styles.lime}>{coach.role}</p>
            <h2 className="text-4xl font-semibold tracking-tight">{coach.name}</h2>
            <p className="mt-2 max-w-xl">{coach.line}</p>
          </article>
        ))}
      </section>
      <section id="certificaciones" className={`${styles.block} bg-[var(--color-surface)]`}>
        <GenericSlotLead section="certificaciones" title={sectionLabels.certificaciones} body={copy.sections.certificaciones} />
        <h2 className={styles.heroTitle}>{copy.communityTitle}</h2>
        <p className="mt-4 max-w-xl">{copy.communityBody}</p>
      </section>
      <DeportesDosForm
        copy={copy}
        locale={locale}
        mailTo={mailTo}
        contactLabels={contactLabels}
        discipline={discipline}
        level={level}
        onDiscipline={setDiscipline}
        onLevel={setLevel}
      />
      <footer className={`${styles.block} border-t border-[var(--color-border)]`}>
        <p className="text-3xl font-semibold">{siteName}</p>
        <nav className="mt-4 flex flex-wrap gap-4" aria-label={siteName}>
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
      </footer>
      <TemplateThumbCta label={copy.cta} />
    </article>
  );
}
