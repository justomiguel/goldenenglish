"use client";

import { useState } from "react";
import { GenericSectionPhoto, GenericSlotLead } from "@/components/organisms/generic-landing/GenericSlotLead";
import { TemplateThumbCta } from "@/components/organisms/generic-landing/TemplateThumbCta";
import { templateNavItems } from "@/lib/landing/templateSections";
import type { Dictionary } from "@/types/i18n";
import { MusicaDosForm } from "@/components/organisms/musica-dos/MusicaDosForm";
import { MusicaDosLab } from "@/components/organisms/musica-dos/MusicaDosLab";
import { MusicaDosSchedule } from "@/components/organisms/musica-dos/MusicaDosSchedule";
import styles from "./musicaDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["musica2"];
type ContactLabels = Dictionary["landing"]["genericContact"];
type ClassRow = Copy["classes"][number];

export function MusicaDosExperience({
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
  const [instrument, setInstrument] = useState(copy.instruments[0]?.id ?? "guitarra");
  const [level, setLevel] = useState(copy.levels[0]?.id ?? "inicio");
  const [when, setWhen] = useState("");
  const nav = templateNavItems(menu);

  function pickInstrument(id: string) {
    setInstrument(id);
    document.getElementById("contacto")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  function pickClass(row: ClassRow) {
    setInstrument(row.instrument);
    setLevel(row.level);
    setWhen(row.when);
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
        <div className={styles.wave} aria-hidden />
        <div className="relative z-10 max-w-4xl">
          <p className={styles.noise}>{copy.noise}</p>
          <p className="mt-4 max-w-xl">{copy.scene}</p>
          <h1 className={styles.heroTitle}>{copy.title}</h1>
          <p className="mt-4 text-xl">{copy.body}</p>
          <div className={styles.actions}>
            <a className={styles.cta} href="#oferta">{copy.heroCta}</a>
            <a className={styles.ghost} href="#contacto">{copy.trialCta}</a>
          </div>
          <p className="mt-8 text-[var(--color-muted-foreground)]">{copy.scrollHint}</p>
        </div>
      </section>
      <section id="historia" className={styles.block}>
        <GenericSlotLead section="historia" title={sectionLabels.historia} body={copy.sections.historia} />
        {copy.manifesto.map((line, index) => (
          <p key={line} className={styles.line} style={{ marginLeft: index % 2 === 0 ? 0 : "8vw" }}>{line}</p>
        ))}
      </section>
      <section id="oferta" className={styles.block}>
        <GenericSlotLead section="oferta" title={sectionLabels.oferta} body={copy.sections.oferta} />
        <div className={styles.track}>
          {copy.instruments.map((item) => (
            <article key={item.id} className={styles.card}>
              <h2 className="text-3xl tracking-tight">{item.name}</h2>
              <p className="mt-3">{item.line}</p>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{item.levels} · {item.mode}</p>
              <button type="button" className={`${styles.cta} mt-4`} onClick={() => pickInstrument(item.id)}>
                {copy.trialCta}
              </button>
            </article>
          ))}
        </div>
      </section>
      <MusicaDosLab
        copy={copy}
        lead={{ title: sectionLabels.modalidades, body: copy.sections.modalidades }}
      />
      <section className={styles.block}>
        {copy.pillars.map((item) => (
          <article key={item.n} className="grid gap-2 border-t border-[var(--color-border)] py-8 md:grid-cols-[6rem_1fr]">
            <p className="text-5xl text-[var(--color-primary)]">{item.n}</p>
            <div>
              <h2 className="text-3xl tracking-tight">{item.title}</h2>
              <p className="mt-2">{item.line}</p>
            </div>
          </article>
        ))}
      </section>
      <MusicaDosSchedule
        copy={copy}
        onPick={pickClass}
        lead={{ title: sectionLabels.niveles, body: copy.sections.niveles }}
      />
      <section id="equipo" className={styles.block}>
        {copy.teachers.map((teacher) => (
          <article key={teacher.name} className="border-t border-[var(--color-border)] py-8">
            <p className="text-[var(--color-accent)]">{teacher.role}</p>
            <h2 className="text-4xl tracking-tight">{teacher.name}</h2>
            <p className="mt-2">{teacher.line}</p>
          </article>
        ))}
      </section>
      <section className={styles.block}>
        {copy.scenes.map((scene, index) => (
          <article key={scene.name} className={index % 2 === 0 ? "py-6" : "bg-[var(--color-surface)] px-4 py-6"}>
            <h2 className="text-3xl tracking-tight">{scene.name}</h2>
            <p className="mt-2 max-w-xl">{scene.line}</p>
          </article>
        ))}
      </section>
      <section id="certificaciones" className={styles.block}>
        <GenericSlotLead section="certificaciones" title={sectionLabels.certificaciones} body={copy.sections.certificaciones} />
        <h2 className="text-5xl uppercase tracking-tight">{copy.billTitle}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{copy.demoNote}</p>
        <ul className="mt-6">
          {copy.shows.map((show) => (
            <li key={show.title} className="grid gap-1 border-t border-[var(--color-primary)] py-4 md:grid-cols-[10rem_1fr]">
              <span>{show.when}</span>
              <span className="text-2xl">{show.title}</span>
            </li>
          ))}
        </ul>
      </section>
      <MusicaDosForm
        copy={copy}
        locale={locale}
        mailTo={mailTo}
        contactLabels={contactLabels}
        instrument={instrument}
        level={level}
        when={when}
        onInstrument={setInstrument}
        onLevel={setLevel}
      />
      <footer className={`${styles.block} border-t border-[var(--color-border)]`}>
        <p className={styles.heroTitle}>{siteName}</p>
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
