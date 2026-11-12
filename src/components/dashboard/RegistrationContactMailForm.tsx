"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { sendRegistrationContactEmailAction } from "@/app/[locale]/dashboard/admin/registrations/sendRegistrationContactEmailAction";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import { registrationMatriculaFailureMessage } from "@/lib/register/registrationMatriculaAlta";
import type { Dictionary } from "@/types/i18n";

type FunnelLabels = Dictionary["admin"]["registrations"]["funnel"];

export function RegistrationContactMailForm({
  locale,
  registrationId,
  toEmail,
  labels,
  disabled,
}: {
  locale: string;
  registrationId: string;
  toEmail: string;
  labels: FunnelLabels;
  disabled: boolean;
}) {
  const [body, setBody] = useState("<p></p>");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const result = await sendRegistrationContactEmailAction({
      locale,
      registrationId,
      bodyHtml: body,
    });
    setBusy(false);
    if (!result.ok) {
      setNotice(
        registrationMatriculaFailureMessage(result.code, labels.errors, labels.unknownError),
      );
      return;
    }
    setNotice(labels.contactMailSent);
    setBody("<p></p>");
  }

  return (
    <form className="flex flex-col gap-2" onSubmit={(event) => void onSubmit(event)}>
      <label className="text-sm text-[var(--color-foreground)]" htmlFor={`contact-mail-${registrationId}`}>
        {labels.contactMailTo}
      </label>
      <Input id={`contact-mail-${registrationId}`} readOnly value={toEmail} aria-label={labels.contactMailTo} />
      <RichTextEditor
        value={body}
        onChange={setBody}
        disabled={disabled || busy}
        aria-label={labels.contactMailBody}
      />
      <Button type="submit" className="min-h-11" disabled={disabled || busy} isLoading={busy}>
        {busy ? null : <Send className="h-4 w-4" aria-hidden />}
        {labels.contactMailSend}
      </Button>
      {notice ? <p className="text-sm text-[var(--color-foreground)]">{notice}</p> : null}
    </form>
  );
}
