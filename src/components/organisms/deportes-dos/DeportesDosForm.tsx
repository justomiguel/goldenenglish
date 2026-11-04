"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { submitGenericLandingContactAction } from "@/app/[locale]/contact/freeSiteContactAction";
import type { Dictionary } from "@/types/i18n";
import styles from "./deportesDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["deportes2"];
type ContactLabels = Dictionary["landing"]["genericContact"];

export function DeportesDosForm({
  copy,
  locale,
  mailTo,
  contactLabels,
  discipline,
  level,
  onDiscipline,
  onLevel,
}: {
  copy: Copy;
  locale: string;
  mailTo: string;
  contactLabels: ContactLabels;
  discipline: string;
  level: string;
  onDiscipline: (id: string) => void;
  onLevel: (id: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const mailQuery = new URLSearchParams({
    subject: copy.mailSubject,
    body: [discipline, level === "all" ? "" : level].filter(Boolean).join("\n"),
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const note = String(data.get("note") ?? "");
    const message = [discipline, level === "all" ? "" : level, note].filter(Boolean).join(" · ");
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
      const labels = contactLabels;
      setError(
        result.errorCode === "preview"
          ? labels.formPreview
          : result.errorCode === "quota"
            ? labels.formQuota
            : result.errorCode === "invalid"
              ? labels.formInvalid
              : result.errorCode === "unavailable"
                ? labels.formUnavailable
                : labels.formPersist,
      );
      return;
    }
    setDone(true);
  }

  return (
    <section id="contacto" className={styles.block}>
      <h2 className={styles.heroTitle}>{copy.laterTitle}</h2>
      <p className="mt-4 max-w-xl">{copy.laterBody}</p>
      {done ? (
        <p className="mt-8" role="status">
          {contactLabels.formSuccess}
        </p>
      ) : (
        <form className="mt-8 max-w-xl space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <Field id="pulso-name" name="name" label={contactLabels.formName} required />
          <Field id="pulso-email" name="email" type="email" label={contactLabels.formEmail} required />
          <Field id="pulso-phone" name="phone" label={contactLabels.formPhone} />
          <label className="block text-sm font-semibold" htmlFor="pulso-discipline">
            {copy.disciplineLabel}
            <select
              id="pulso-discipline"
              className={styles.select}
              value={discipline}
              onChange={(event) => onDiscipline(event.target.value)}
            >
              {copy.disciplines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold" htmlFor="pulso-level">
            {copy.levelLabel}
            <select id="pulso-level" className={styles.select} value={level} onChange={(event) => onLevel(event.target.value)}>
              <option value="all">{copy.levelAll}</option>
              {copy.levels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold" htmlFor="pulso-note">
            {copy.optionalMessage}
            <textarea id="pulso-note" name="note" className={styles.field} rows={4} />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input name="privacy" type="checkbox" required />
            {copy.privacy}
          </label>
          {error ? (
            <p role="alert" className="text-[var(--color-error)]">
              {error}
            </p>
          ) : null}
          <button className={styles.cta} type="submit" disabled={pending}>
            <ArrowRight className="h-4 w-4" aria-hidden />
            {pending ? copy.sending : copy.cta}
          </button>
          <a className={styles.ghost} href={`mailto:${mailTo}?${mailQuery.toString()}`}>
            {copy.mailCta}
          </a>
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
