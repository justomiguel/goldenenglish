"use client";

import { useState } from "react";
import { submitGenericLandingContactAction } from "@/app/[locale]/contact/freeSiteContactAction";
import type { Dictionary } from "@/types/i18n";
import styles from "./jardinDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["jardin2"];
type ContactLabels = Dictionary["landing"]["genericContact"];

export function JardinDosForm({
  copy,
  locale,
  mailTo,
  contactLabels,
  stageId,
  onStage,
}: {
  copy: Copy;
  locale: string;
  mailTo: string;
  contactLabels: ContactLabels;
  stageId: string;
  onStage: (id: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const mail = new URLSearchParams({ subject: copy.mailSubject, body: stageId });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [
      String(data.get("age") ?? ""),
      stageId,
      String(data.get("visit") ?? ""),
      String(data.get("note") ?? ""),
    ]
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
      <h2 className="max-w-xl text-4xl tracking-tight">{copy.laterTitle}</h2>
      <p className="mt-3 max-w-xl">{copy.laterBody}</p>
      {done ? (
        <p className="mt-8" role="status">{contactLabels.formSuccess}</p>
      ) : (
        <form className="mt-8 max-w-xl space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <Field id="nido-name" name="name" label={copy.guardianLabel} required />
          <Field id="nido-email" name="email" type="email" label={contactLabels.formEmail} required />
          <Field id="nido-phone" name="phone" label={contactLabels.formPhone} />
          <Field id="nido-age" name="age" label={copy.childAgeLabel} required />
          <label className="block text-sm font-semibold" htmlFor="nido-stage">
            {copy.levelLabel}
            <select id="nido-stage" className={styles.select} value={stageId} onChange={(event) => onStage(event.target.value)}>
              {copy.stages.map((stage) => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </label>
          <Field id="nido-visit" name="visit" type="date" label={copy.visitLabel} />
          <label className="block text-sm font-semibold" htmlFor="nido-note">
            {contactLabels.formMessage}
            <textarea id="nido-note" name="note" className={styles.field} rows={4} />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input name="privacy" type="checkbox" required />
            {copy.privacy}
          </label>
          {error ? <p role="alert" className="text-[var(--color-error)]">{error}</p> : null}
          <button className={styles.cta} type="submit" disabled={pending}>
            {pending ? copy.sending : copy.cta}
          </button>
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
