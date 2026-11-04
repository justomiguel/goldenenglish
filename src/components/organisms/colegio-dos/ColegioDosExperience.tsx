"use client";

import { useState } from "react";
import { GenericSectionPhoto, GenericSlotLead } from "@/components/organisms/generic-landing/GenericSlotLead";
import { TemplateThumbCta } from "@/components/organisms/generic-landing/TemplateThumbCta";
import { templateNavItems } from "@/lib/landing/templateSections";
import type { Dictionary } from "@/types/i18n";
import { ColegioDosForm } from "@/components/organisms/colegio-dos/ColegioDosForm";
import { ColegioDosLife } from "@/components/organisms/colegio-dos/ColegioDosLife";
import styles from "./colegioDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["colegio2"];
type ContactLabels = Dictionary["landing"]["genericContact"];

export function ColegioDosExperience({
  copy,
  locale,
  siteName,
  mailTo,
  contactLabels,
  menu,
  sectionLabels,
}: {
  copy: Copy;
  locale: string;
  siteName: string;
  mailTo: string;
  contactLabels: ContactLabels;
  menu: Dictionary["landing"]["templateNav"];
  sectionLabels: Dictionary["landing"]["genericSectionLabels"];
}) {
  const [stageId, setStageId] = useState(copy.stages[0]?.id ?? "");
  const nav = templateNavItems(menu);

  function pickStage(id: string) {
    setStageId(id);
    document.getElementById("contacto")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  return (
    <article className={styles.stage}>
      <header className={styles.bar}>
        <a href="#inicio">{siteName}</a>
        <nav aria-label={siteName} className={styles.nav}>
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>
      </header>
      <section id="inicio" className={styles.hero}>
        <GenericSectionPhoto placement="hero" section="inicio" alt={copy.imageAlt} />
        <div className={styles.orbit} aria-hidden />
        <div className={styles.beam} aria-hidden />
        <div className="relative z-10 max-w-4xl">
          <p className="text-[var(--color-primary)]">{copy.scene}</p>
          <h1 className={styles.heroTitle}>{copy.title}</h1>
          <p className="mt-4 text-xl">{copy.body}</p>
          <div className={styles.actions}>
            <a className={styles.cta} href="#oferta">{copy.heroCta}</a>
            <a className={styles.ghost} href="#contacto">{copy.cta}</a>
          </div>
          <p className="mt-8 text-[var(--color-muted-foreground)]">{copy.scrollHint}</p>
        </div>
      </section>
      <section id="historia" className={styles.block}>
        <GenericSlotLead section="historia" title={sectionLabels.historia} body={copy.sections.historia} />
        {copy.manifesto.map((line) => (
          <p key={line} className={styles.line}>{line}</p>
        ))}
      </section>
      <section id="oferta">
        <GenericSlotLead section="oferta" title={sectionLabels.oferta} body={copy.sections.oferta} />
        {copy.stages.map((stage) => (
          <article key={stage.id} className="border-t border-[var(--color-border)] px-5 py-10">
            <p className="text-[var(--color-accent)]">{stage.ages}</p>
            <h2 className="mt-2 max-w-xl text-4xl tracking-tight md:text-6xl">{stage.name}</h2>
            <p className="mt-3">{stage.aim}</p>
            <p className="mt-1 max-w-md text-[var(--color-muted-foreground)]">{stage.experience}</p>
            <button type="button" className={`${styles.cta} mt-5`} onClick={() => pickStage(stage.id)}>
              {copy.cta}
            </button>
          </article>
        ))}
      </section>
      <section id="modalidades" className={styles.block}>
        <GenericSlotLead section="modalidades" title={sectionLabels.modalidades} body={copy.sections.modalidades} />
        <p className="text-sm text-[var(--color-muted-foreground)]">{copy.sampleNote}</p>
        {copy.pillars.map((item) => (
          <article key={item.n} className="grid items-end gap-3 border-t border-[var(--color-border)] py-8 md:grid-cols-[8rem_1fr]">
            <p className={styles.number}>{item.n}</p>
            <div>
              <h2 className="text-3xl tracking-tight">{item.title}</h2>
              <p className="mt-2">{item.line}</p>
            </div>
          </article>
        ))}
      </section>
      <ColegioDosLife copy={copy} sectionLabels={sectionLabels} sections={copy.sections} />
      <ColegioDosForm
        copy={copy}
        locale={locale}
        mailTo={mailTo}
        contactLabels={contactLabels}
        stageId={stageId}
        onStage={setStageId}
      />
      <footer className={`${styles.block} border-t border-[var(--color-border)]`}>
        <p className="text-3xl tracking-tight">{siteName}</p>
        <p className="mt-2 max-w-md text-[var(--color-muted-foreground)]">{copy.body}</p>
        <nav className="mt-4 flex flex-wrap gap-4" aria-label={siteName}>
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>
      </footer>
      <TemplateThumbCta label={copy.cta} />
    </article>
  );
}
