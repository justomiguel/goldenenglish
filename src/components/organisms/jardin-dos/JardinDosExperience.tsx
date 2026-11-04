"use client";

import { useState } from "react";
import { GenericSectionPhoto, GenericSlotLead } from "@/components/organisms/generic-landing/GenericSlotLead";
import { TemplateThumbCta } from "@/components/organisms/generic-landing/TemplateThumbCta";
import { templateNavItems } from "@/lib/landing/templateSections";
import type { Dictionary } from "@/types/i18n";
import { JardinDosForm } from "@/components/organisms/jardin-dos/JardinDosForm";
import { JardinDosMore } from "@/components/organisms/jardin-dos/JardinDosMore";
import styles from "./jardinDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["jardin2"];
type ContactLabels = Dictionary["landing"]["genericContact"];

export function JardinDosExperience({
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
  const [dayId, setDayId] = useState(copy.day[0]?.id ?? "");
  const [spaceId, setSpaceId] = useState(copy.spaces[0]?.id ?? "");
  const day = copy.day.find((item) => item.id === dayId) ?? copy.day[0];
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
        <div className={styles.cloud} aria-hidden />
        <div className={styles.leaf} aria-hidden />
        <div className={styles.seed} aria-hidden />
        <div className="relative z-10 max-w-3xl">
          <p className="text-[var(--color-accent)]">{copy.scene}</p>
          <h1 className={styles.heroTitle}>{copy.title}</h1>
          <p className="mt-4 max-w-xl">{copy.body}</p>
          <div className={styles.actions}>
            <a className={styles.cta} href="#oferta">{copy.heroCta}</a>
            <a className={styles.ghost} href="#contacto">{copy.cta}</a>
          </div>
          <p className="mt-8 text-[var(--color-muted-foreground)]">{copy.scrollHint}</p>
        </div>
      </section>
      <section id="historia" className={styles.block}>
        <GenericSlotLead section="historia" title={sectionLabels.historia} body={copy.sections.historia} />
        <svg className={styles.tree} viewBox="0 0 80 120" aria-hidden>
          <path d="M40 110 V48" stroke="var(--color-primary)" strokeWidth="4" fill="none" />
          <circle cx="40" cy="36" r="22" fill="var(--color-primary)" />
          <circle cx="28" cy="48" r="14" fill="var(--color-accent)" />
          <circle cx="40" cy="108" r="5" fill="var(--color-accent)" />
        </svg>
        {copy.seed.map((line) => (
          <p key={line} className={styles.storyLine}>{line}</p>
        ))}
      </section>
      <section id="oferta">
        <GenericSlotLead section="oferta" title={sectionLabels.oferta} body={copy.sections.oferta} />
        {copy.stages.map((stage) => (
          <article key={stage.id} className={styles.stageCard}>
            <p className="text-[var(--color-accent)]">{stage.ages}</p>
            <h3>{stage.name}</h3>
            <p className="mt-2">{stage.aim}</p>
            <p className="mt-1 max-w-md text-[var(--color-muted-foreground)]">{stage.experience}</p>
            <button type="button" className={`${styles.cta} mt-4`} onClick={() => pickStage(stage.id)}>
              {copy.cta}
            </button>
          </article>
        ))}
      </section>
      <JardinDosMore copy={copy} spaceId={spaceId} onSpace={setSpaceId} sectionLabels={sectionLabels} sections={copy.sections}>
      <section id="niveles" className={styles.block}>
        <GenericSlotLead section="niveles" title={sectionLabels.niveles} body={copy.sections.niveles} />
        <div className="flex flex-wrap gap-3">
          {copy.day.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === day?.id}
              className={`min-h-11 border-b ${item.id === day?.id ? "border-[var(--color-primary)]" : "border-transparent"}`}
              onClick={() => setDayId(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
        {day ? <p className="mt-8 max-w-xl text-3xl tracking-tight">{day.line}</p> : null}
      </section>
      </JardinDosMore>
      <JardinDosForm
        copy={copy}
        locale={locale}
        mailTo={mailTo}
        contactLabels={contactLabels}
        stageId={stageId}
        onStage={setStageId}
      />
      <footer className={`${styles.block} border-t border-[var(--color-border)]`}>
        <p className="text-3xl">{siteName}</p>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{copy.scene}</p>
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
