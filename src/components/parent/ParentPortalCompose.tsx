"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendParentMessage } from "@/app/[locale]/dashboard/parent/messages/actions";
import { Button } from "@/components/atoms/Button";
import { RecipientAutocomplete } from "@/components/molecules/RecipientAutocomplete";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import type { Dictionary } from "@/types/i18n";
import type { MessagingRecipient } from "@/types/messaging";

interface ParentPortalComposeProps {
  locale: string;
  recipients: MessagingRecipient[];
  labels: Dictionary["dashboard"]["parent"];
}

export function ParentPortalCompose({ locale, recipients = [], labels }: ParentPortalComposeProps) {
  const router = useRouter();
  const singleRecipientId = recipients.length === 1 ? recipients[0].id : "";
  const [recipientId, setRecipientId] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const effectiveRecipientId = recipientId || singleRecipientId;

  const roleLabels = { teacher: labels.messagesRoleTeacher };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveRecipientId) return;
    setBusy(true);
    setMsg(null);
    const res = await sendParentMessage(locale, effectiveRecipientId, body);
    setBusy(false);
    if (res.ok) {
      setMsg(labels.messagesComposeSent);
      setBody("<p></p>");
      setRecipientId("");
      router.refresh();
    } else {
      setMsg(`${labels.messagesComposeError}${res.message ? `: ${res.message}` : ""}`);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 overflow-visible rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
        {labels.messagesComposeTitle}
      </h2>
      <label className="block text-sm font-medium text-[var(--color-foreground)]" htmlFor="parent-msg-to">
        {labels.messagesComposeTo}
      </label>
      <RecipientAutocomplete
        id="parent-msg-to"
        options={recipients}
        value={effectiveRecipientId}
        onValueChange={setRecipientId}
        disabled={busy}
        placeholder={labels.messagesRecipientSearchPlaceholder}
        noMatchesText={labels.messagesRecipientNoMatches}
        emptyOptionsText={labels.messagesRecipientListEmpty}
        roleLabels={roleLabels}
        ariaLabel={labels.messagesComposeTo}
      />
      <RichTextEditor
        value={body}
        onChange={setBody}
        disabled={busy}
        aria-label={labels.messagesComposeAria}
      />
      <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px]">
        {labels.messagesComposeSend}
      </Button>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </form>
  );
}
