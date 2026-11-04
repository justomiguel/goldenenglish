"use client";

import { useState } from "react";
import { GenericSectionPhoto, GenericSlotLead } from "@/components/organisms/generic-landing/GenericSlotLead";
import { TemplateThumbCta } from "@/components/organisms/generic-landing/TemplateThumbCta";
import { templateNavItems } from "@/lib/landing/templateSections";
import type { Dictionary } from "@/types/i18n";
import { IdiomasDosCatalog } from "@/components/organisms/idiomas-dos/IdiomasDosCatalog";
import { IdiomasDosForm } from "@/components/organisms/idiomas-dos/IdiomasDosForm";
import { IdiomasDosQuiz } from "@/components/organisms/idiomas-dos/IdiomasDosQuiz";
import styles from "./idiomasDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["idiomas2"];
type ContactLabels = Dictionary["landing"]["genericContact"];
type Course = Copy["courses"][number];

export function IdiomasDosExperience({
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
  const [greeting, setGreeting] = useState(copy.greetings[0]?.id ?? "en");
  const [language, setLanguage] = useState(copy.greetings[0]?.id ?? "en");
  const [level, setLevel] = useState("A1");
  const [mode, setMode] = useState(copy.modes[0]?.id ?? "presencial");
  const [courseId, setCourseId] = useState("");
  const word = copy.greetings.find((item) => item.id === greeting) ?? copy.greetings[0];
  const modeCopy = copy.modes.find((item) => item.id === mode) ?? copy.modes[0];
  const nav = templateNavItems(menu);

  function pickCourse(course: Course) {
    setLanguage(course.language);
    setLevel(course.level);
    setMode(course.mode);
    setCourseId(course.id);
    document.getElementById("contacto")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  function pickLevel(next: string) {
    setLevel(next);
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
        <div className={styles.blockA} aria-hidden />
        <div className={styles.blockB} aria-hidden />
        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap gap-2">
            {copy.greetings.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === greeting}
                className={styles.chip}
                onClick={() => setGreeting(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p key={word?.word} className={styles.word}>{word?.word}</p>
          <p className="mt-4 max-w-xl text-[var(--color-primary)]">{copy.scene}</p>
          <h1 className={styles.heroTitle}>{copy.title}</h1>
          <p className="mt-3 text-xl">{copy.body}</p>
          <div className={styles.actions}>
            <a className={styles.cta} href="#oferta">{copy.heroCta}</a>
            <a className={styles.ghost} href="#niveles">{copy.levelCta}</a>
          </div>
          <p className="mt-8 text-[var(--color-muted-foreground)]">{copy.scrollHint}</p>
        </div>
      </section>
      <section id="historia" className={styles.block}>
        <GenericSlotLead section="historia" title={sectionLabels.historia} body={copy.sections.historia} />
        {copy.manifesto.map((line) => (
          <p key={line} className={styles.giant}>{line}</p>
        ))}
      </section>
      <section id="oferta">
        <GenericSlotLead section="oferta" title={sectionLabels.oferta} body={copy.sections.oferta} />
        {copy.languages.map((item, index) => (
          <article
            key={item.id}
            className={index % 2 === 0 ? "bg-[var(--color-primary)] px-5 py-12 text-[var(--color-primary-foreground)]" : "px-5 py-12"}
          >
            <p>{item.start} · {item.weeks}</p>
            <h2 className="mt-2 text-5xl tracking-tight">{item.name}</h2>
            <p className="mt-3 max-w-md">{item.aim}</p>
            <button type="button" className={`${styles.cta} mt-5`} onClick={() => pickCourse({
              id: "",
              language: item.id,
              level: item.start,
              mode,
              when: "",
              weeks: item.weeks,
              title: item.name,
            })}>
              {copy.cta}
            </button>
          </article>
        ))}
      </section>
      <section id="modalidades" className={styles.block}>
        <GenericSlotLead section="modalidades" title={sectionLabels.modalidades} body={copy.sections.modalidades} />
        <div className="flex flex-wrap gap-2">
          {copy.modes.map((item) => (
            <button key={item.id} type="button" aria-pressed={item.id === mode} className={styles.chip} onClick={() => setMode(item.id)}>
              {item.name}
            </button>
          ))}
        </div>
        {modeCopy ? <p className="mt-8 max-w-xl text-3xl tracking-tight">{modeCopy.line}</p> : null}
      </section>
      <section className={styles.block}>
        {copy.pillars.map((item) => (
          <article key={item.n} className="grid gap-2 border-t border-[var(--color-border)] py-8 md:grid-cols-[5rem_1fr]">
            <p className="text-4xl text-[var(--color-primary)]">{item.n}</p>
            <div>
              <h2 className="text-3xl tracking-tight">{item.title}</h2>
              <p className="mt-2">{item.line}</p>
            </div>
          </article>
        ))}
      </section>
      <IdiomasDosQuiz
        copy={copy}
        onLevel={pickLevel}
        lead={{ title: sectionLabels.niveles, body: copy.sections.niveles }}
      />
      <IdiomasDosCatalog copy={copy} onPick={pickCourse} />
      <section id="equipo" className={styles.block}>
        {copy.teachers.map((teacher) => (
          <article key={teacher.name} className="border-t border-[var(--color-border)] py-8">
            <p className="text-[var(--color-primary)]">{teacher.role}</p>
            <h2 className="text-4xl tracking-tight">{teacher.name}</h2>
            <p className="mt-2">{teacher.line}</p>
          </article>
        ))}
      </section>
      <section id="certificaciones" className={styles.block}>
        <GenericSlotLead section="certificaciones" title={sectionLabels.certificaciones} body={copy.sections.certificaciones} />
        <div className={styles.track}>
          {copy.scenes.map((scene) => (
            <article key={scene.name} className={styles.scene}>
              <h2 className="text-3xl tracking-tight">{scene.name}</h2>
              <p className="mt-3">{scene.line}</p>
            </article>
          ))}
        </div>
      </section>
      <IdiomasDosForm
        copy={copy}
        locale={locale}
        mailTo={mailTo}
        contactLabels={contactLabels}
        language={language}
        level={level}
        mode={mode}
        courseId={courseId}
        onLanguage={setLanguage}
        onLevel={setLevel}
        onMode={setMode}
        onCourse={setCourseId}
      />
      <footer className={`${styles.block} border-t border-[var(--color-border)]`}>
        <p className="text-3xl tracking-tight">{siteName}</p>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{copy.socialNote}</p>
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
