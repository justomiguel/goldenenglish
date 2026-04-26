"use client";

import { useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { upsertClassReminderChannelPrefsAction } from "@/app/[locale]/dashboard/profile/classReminderPrefsActions";

type PrefsRow = {
  email_class_prep?: boolean | null;
  in_app_class_urgent?: boolean | null;
  whatsapp_class_urgent?: boolean | null;
  whatsapp_opt_in_at?: string | null;
  whatsapp_phone_e164?: string | null;
  whatsapp_last_error_code?: string | null;
};

type Labels = Pick<
  Dictionary["dashboard"]["student"],
  | "classReminderPrefsTitle"
  | "classReminderPrefsHint"
  | "classReminderEmailPrep"
  | "classReminderInAppUrgent"
  | "classReminderWhatsappUrgent"
  | "classReminderWhatsappOptIn"
  | "classReminderWhatsappPhone"
  | "classReminderWhatsappPhoneHint"
  | "classReminderPrefsSave"
  | "classReminderPrefsSaved"
  | "classReminderPrefsError"
  | "classReminderWhatsappErrorBanner"
>;

export interface ClassReminderPrefsSectionProps {
  locale: string;
  studentId: string;
  initial: PrefsRow | null;
  labels: Labels;
  /** When true, render only the form (parent supplies title/hint). */
  omitHeader?: boolean;
}

export function ClassReminderPrefsSection({
  locale,
  studentId,
  initial,
  labels,
  omitHeader = false,
}: ClassReminderPrefsSectionProps) {
  const [emailPrep, setEmailPrep] = useState(initial?.email_class_prep ?? true);
  const [inApp, setInApp] = useState(initial?.in_app_class_urgent ?? true);
  const [wa, setWa] = useState(Boolean(initial?.whatsapp_class_urgent));
  const [waOptIn, setWaOptIn] = useState(Boolean(initial?.whatsapp_opt_in_at));
  const [phone, setPhone] = useState(initial?.whatsapp_phone_e164 ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setBusy(true);
    const res = await upsertClassReminderChannelPrefsAction({
      locale,
      studentId,
      emailClassPrep: emailPrep,
      inAppClassUrgent: inApp,
      whatsappClassUrgent: wa && waOptIn,
      whatsappPhoneE164: phone.trim() || null,
    });
    setBusy(false);
    if (res.ok) setMsg(res.message ?? labels.classReminderPrefsSaved);
    else setErr(res.message ?? labels.classReminderPrefsError);
  }

  const showWaBanner = Boolean(initial?.whatsapp_last_error_code);

  return (
    <section className="mt-8 border-t border-[color-mix(in_srgb,var(--color-accent)_20%,var(--color-border))] pt-6">
      {!omitHeader ? (
        <>
          <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
            {labels.classReminderPrefsTitle}
          </h2>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
            {labels.classReminderPrefsHint}
          </p>
        </>
      ) : null}
      {showWaBanner ? (
        <p className="mt-4 rounded-lg border border-[var(--color-error)] bg-[var(--color-muted)] px-3 py-2 text-sm text-[var(--color-error)]">
          {labels.classReminderWhatsappErrorBanner}
        </p>
      ) : null}
      <form onSubmit={(ev) => void onSubmit(ev)} className="mt-6 space-y-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-[var(--color-border)]"
            checked={emailPrep}
            onChange={(e) => setEmailPrep(e.target.checked)}
          />
          <span className="text-sm font-medium text-[var(--color-foreground)]">{labels.classReminderEmailPrep}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-[var(--color-border)]"
            checked={inApp}
            onChange={(e) => setInApp(e.target.checked)}
          />
          <span className="text-sm font-medium text-[var(--color-foreground)]">{labels.classReminderInAppUrgent}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-[var(--color-border)]"
            checked={wa}
            onChange={(e) => {
              setWa(e.target.checked);
              if (!e.target.checked) setWaOptIn(false);
            }}
          />
          <span className="text-sm font-medium text-[var(--color-foreground)]">
            {labels.classReminderWhatsappUrgent}
          </span>
        </label>
        {wa ? (
          <div className="ml-8 space-y-3 border-l border-[var(--color-border)] pl-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-[var(--color-border)]"
                checked={waOptIn}
                onChange={(e) => setWaOptIn(e.target.checked)}
              />
              <span className="text-sm text-[var(--color-foreground)]">{labels.classReminderWhatsappOptIn}</span>
            </label>
            <div>
              <Label htmlFor={`wa-phone-${studentId}`}>{labels.classReminderWhatsappPhone}</Label>
              <Input
                id={`wa-phone-${studentId}`}
                type="tel"
                autoComplete="tel"
                className="mt-1"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+549…"
              />
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.classReminderWhatsappPhoneHint}</p>
            </div>
          </div>
        ) : null}
        <Button
          type="submit"
          className="min-h-[44px]"
          disabled={busy}
          isLoading={busy}
        >
          {!busy ? (
            <Save className="h-4 w-4 shrink-0" aria-hidden />
          ) : null}
          {labels.classReminderPrefsSave}
        </Button>
        {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
        {err ? <p className="text-sm text-[var(--color-error)]">{err}</p> : null}
      </form>
    </section>
  );
}
