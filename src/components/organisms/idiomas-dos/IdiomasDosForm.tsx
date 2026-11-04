"use client";

import { useState, type ReactNode } from "react";
import { submitGenericLandingContactAction } from "@/app/[locale]/contact/freeSiteContactAction";
import type { Dictionary } from "@/types/i18n";
import styles from "./idiomasDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["idiomas2"];
type ContactLabels = Dictionary["landing"]["genericContact"];

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

export function IdiomasDosForm({
  copy,
  locale,
  mailTo,
  contactLabels,
  language,
  level,
  mode,
  courseId,
  onLanguage,
  onLevel,
  onMode,
  onCourse,
}: {
  copy: Copy;
  locale: string;
  mailTo: string;
  contactLabels: ContactLabels;
  language: string;
  level: string;
  mode: string;
  courseId: string;
  onLanguage: (id: string) => void;
  onLevel: (id: string) => void;
  onMode: (id: string) => void;
  onCourse: (id: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const mail = new URLSearchParams({
    subject: copy.mailSubject,
    body: [language, level, mode, courseId].filter(Boolean).join("\n"),
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [language, level, mode, courseId, String(data.get("note") ?? "")].filter(Boolean).join(" · ");
    setPending(true);
    setError(null);
    const result = await submitGenericLandingContactAction({
      locale,
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: message || copy.cta,
    });
    setPending(false);
    if (!result.ok) {
      setError(
        result.errorCode === "preview"
          ? contactLabels.formPreview
          : result.errorCode === "quota"
            ? contactLabels.formQuota
            : result.errorCode === "invalid"
              ? contactLabels.formInvalid
              : result.errorCode === "unavailable"
                ? contactLabels.formUnavailable
                : contactLabels.formPersist,
      );
      return;
    }
    setDone(true);
  }

  return (
    <section id="contacto" className={styles.block}>
      <h2 className="max-w-3xl text-4xl tracking-tight md:text-6xl">{copy.laterTitle}</h2>
      <p className="mt-3 max-w-xl">{copy.laterBody}</p>
      {done ? (
        <p className="mt-8" role="status">{contactLabels.formSuccess}</p>
      ) : (
        <form className="mt-8 max-w-xl space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <Field id="lingua-name" name="name" label={contactLabels.formName} required />
          <Field id="lingua-email" name="email" type="email" label={contactLabels.formEmail} required />
          <Field id="lingua-phone" name="phone" label={contactLabels.formPhone} />
          <Select id="lingua-language" label={copy.languageLabel} value={language} onChange={onLanguage}>
            {copy.greetings.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </Select>
          <Select id="lingua-level" label={copy.levelLabel} value={level} onChange={onLevel}>
            {LEVELS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
          <Select id="lingua-mode" label={copy.modeLabel} value={mode} onChange={onMode}>
            {copy.modes.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Select>
          <Select id="lingua-course" label={copy.courseLabel} value={courseId} onChange={onCourse}>
            <option value="">{copy.all}</option>
            {copy.courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </Select>
          <label className="block text-sm font-semibold" htmlFor="lingua-note">
            {contactLabels.formMessage}
            <textarea id="lingua-note" name="note" className={styles.field} rows={4} />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input name="privacy" type="checkbox" required />
            {copy.privacy}
          </label>
          {error ? <p role="alert" className="text-[var(--color-error)]">{error}</p> : null}
          <button className={styles.cta} type="submit" disabled={pending}>{pending ? copy.sending : copy.cta}</button>
          <a className={styles.ghost} href={`mailto:${mailTo}?${mail.toString()}`}>{copy.mailCta}</a>
        </form>
      )}
    </section>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold" htmlFor={id}>
      {label}
      <input id={id} name={name} type={type} required={required} className={styles.field} />
    </label>
  );
}

function Select({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold" htmlFor={id}>
      {label}
      <select id={id} className={styles.select} value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}
