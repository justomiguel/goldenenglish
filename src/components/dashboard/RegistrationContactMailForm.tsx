"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { sendRegistrationContactEmailAction } from "@/app/[locale]/dashboard/admin/registrations/sendRegistrationContactEmailAction";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import type { RegistrationWorkTask } from "@/hooks/useMarkContactedWithLoader";
import { registrationMatriculaFailureMessage } from "@/lib/register/registrationMatriculaAlta";
import type { Dictionary } from "@/types/i18n";

type FunnelLabels = Dictionary["admin"]["registrations"]["funnel"];

export function RegistrationContactMailForm({
  locale,
  registrationId,
  toEmail,
  labels,
  disabled,
  onWork,
}: {
  locale: string;
  registrationId: string;
  toEmail: string;
  labels: FunnelLabels;
  disabled: boolean;
  onWork: (task: RegistrationWorkTask) => void;
}) {
  const [body, setBody] = useState("<p></p>");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const html = body;
    onWork(async () => {
      const result = await sendRegistrationContactEmailAction({
        locale,
        registrationId,
        bodyHtml: html,
      });
      if (!result?.ok) {
        return registrationMatriculaFailureMessage(
          result?.code ?? "unknown",
          labels.errors,
          labels.unknownError,
        );
      }
      return null;
    });
  }

  return (
    <form className="flex flex-col gap-2" onSubmit={onSubmit}>
      <label className="text-sm text-[var(--color-foreground)]" htmlFor={`contact-mail-${registrationId}`}>
        {labels.contactMailTo}
      </label>
      <Input id={`contact-mail-${registrationId}`} readOnly value={toEmail} aria-label={labels.contactMailTo} />
      <RichTextEditor
        value={body}
        onChange={setBody}
        disabled={disabled}
        aria-label={labels.contactMailBody}
      />
      <Button type="submit" className="min-h-11" disabled={disabled}>
        <Send className="h-4 w-4" aria-hidden />
        {labels.contactMailSend}
      </Button>
    </form>
  );
}
