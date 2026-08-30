"use client";

import { useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { submitPublicContactForm } from "@/app/[locale]/contact/actions";

const AGES = ["ageChild", "ageTeen", "ageAdult", "ageSenior"] as const;
const PROGRAMS = ["ninos", "jovenes", "adultos", "mayores"] as const;

export function NagoLandingLeadForm({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: string;
}) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState<(typeof AGES)[number]>("ageAdult");
  const [program, setProgram] = useState<(typeof PROGRAMS)[number]>("adultos");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const composed = [
      `${t("lead.age")}: ${t(`lead.${age}`)}`,
      `${t("lead.program")}: ${t(`programas.${program}.title`)}`,
      body,
    ].join("\n");
    const res = await submitPublicContactForm(locale, {
      fullName,
      email,
      phone,
      subject: "classes",
      body: composed,
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      return;
    }
    setError(res.message);
  }

  if (done) {
    return (
      <p className="text-center text-[var(--nago-ink)]">{dict.publicContact.success}</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="nago-lead mx-auto grid max-w-xl gap-3 text-left">
      <label className="block text-xs uppercase tracking-[0.08em] text-[var(--nago-ink-muted)]">
        {t("lead.name")}
        <input
          required
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full border border-[var(--nago-gold)]/25 bg-black/40 px-3 py-3 text-sm text-[var(--nago-ink)]"
        />
      </label>
      <label className="block text-xs uppercase tracking-[0.08em] text-[var(--nago-ink-muted)]">
        {t("lead.whatsapp")}
        <input
          required
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full border border-[var(--nago-gold)]/25 bg-black/40 px-3 py-3 text-sm text-[var(--nago-ink)]"
        />
      </label>
      <label className="block text-xs uppercase tracking-[0.08em] text-[var(--nago-ink-muted)]">
        {t("lead.email")}
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border border-[var(--nago-gold)]/25 bg-black/40 px-3 py-3 text-sm text-[var(--nago-ink)]"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs uppercase tracking-[0.08em] text-[var(--nago-ink-muted)]">
          {t("lead.age")}
          <select
            value={age}
            onChange={(e) => setAge(e.target.value as (typeof AGES)[number])}
            className="mt-1 w-full border border-[var(--nago-gold)]/25 bg-black/40 px-3 py-3 text-sm text-[var(--nago-ink)]"
          >
            {AGES.map((key) => (
              <option key={key} value={key}>
                {t(`lead.${key}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs uppercase tracking-[0.08em] text-[var(--nago-ink-muted)]">
          {t("lead.program")}
          <select
            value={program}
            onChange={(e) => setProgram(e.target.value as (typeof PROGRAMS)[number])}
            className="mt-1 w-full border border-[var(--nago-gold)]/25 bg-black/40 px-3 py-3 text-sm text-[var(--nago-ink)]"
          >
            {PROGRAMS.map((key) => (
              <option key={key} value={key}>
                {t(`programas.${key}.title`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-xs uppercase tracking-[0.08em] text-[var(--nago-ink-muted)]">
        {t("lead.message")}
        <textarea
          required
          name="body"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 w-full border border-[var(--nago-gold)]/25 bg-black/40 px-3 py-3 text-sm text-[var(--nago-ink)]"
        />
      </label>
      <button type="submit" disabled={busy} className="nago-btn nago-btn-solid mt-1">
        {busy ? dict.publicContact.submitting : t("lead.submit")}
      </button>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
