"use client";

import { useState } from "react";
import { submitGenericLandingContactAction } from "@/app/[locale]/contact/freeSiteContactAction";
import type { Dictionary } from "@/types/i18n";
import styles from "./musicaDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["musica2"];
type ContactLabels = Dictionary["landing"]["genericContact"];

export function MusicaDosForm({
  copy,
  locale,
  mailTo,
  contactLabels,
  instrument,
  level,
  when,
  onInstrument,
  onLevel,
}: {
  copy: Copy;
  locale: string;
  mailTo: string;
  contactLabels: ContactLabels;
  instrument: string;
  level: string;
  when: string;
  onInstrument: (id: string) => void;
  onLevel: (id: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const mail = new URLSearchParams({
    subject: copy.mailSubject,
    body: [instrument, level, when].filter(Boolean).join("\n"),
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [instrument, level, String(data.get("when") ?? when), String(data.get("note") ?? "")]
      .filter(Boolean)
      .join(" · ");
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
          <Field id="freq-name" name="name" label={contactLabels.formName} required />
          <Field id="freq-email" name="email" type="email" label={contactLabels.formEmail} required />
          <Field id="freq-phone" name="phone" label={contactLabels.formPhone} />
          <label className="block text-sm font-semibold" htmlFor="freq-instrument">
            {copy.instrumentLabel}
            <select id="freq-instrument" className={styles.select} value={instrument} onChange={(event) => onInstrument(event.target.value)}>
              {copy.instruments.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold" htmlFor="freq-level">
            {copy.levelLabel}
            <select id="freq-level" className={styles.select} value={level} onChange={(event) => onLevel(event.target.value)}>
              {copy.levels.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <Field key={when} id="freq-when" name="when" label={copy.timeLabel} defaultValue={when} />
          <label className="block text-sm font-semibold" htmlFor="freq-note">
            {contactLabels.formMessage}
            <textarea id="freq-note" name="note" className={styles.field} rows={4} />
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
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm font-semibold" htmlFor={id}>
      {label}
      <input id={id} name={name} type={type} required={required} defaultValue={defaultValue} className={styles.field} />
    </label>
  );
}
