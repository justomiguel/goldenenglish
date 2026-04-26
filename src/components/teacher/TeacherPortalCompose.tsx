"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendTeacherMessage } from "@/app/[locale]/dashboard/teacher/messages/actions";
import { Button } from "@/components/atoms/Button";
import { RecipientAutocomplete } from "@/components/molecules/RecipientAutocomplete";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import type { Dictionary } from "@/types/i18n";
import type { MessagingRecipient } from "@/types/messaging";

export type { MessagingRecipient };

interface TeacherPortalComposeProps {
  locale: string;
  recipients: MessagingRecipient[];
  labels: Dictionary["dashboard"]["teacher"];
}

export function TeacherPortalCompose({ locale, recipients = [], labels }: TeacherPortalComposeProps) {
  const router = useRouter();
  const [recipientId, setRecipientId] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const roleLabels = {
    student: labels.messagesRoleStudent,
    parent: labels.messagesRoleParent,
    teacher: labels.messagesRoleTeacher,
    admin: labels.messagesRoleAdmin,
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientId) return;
    setBusy(true);
    setMsg(null);
    const res = await sendTeacherMessage(locale, recipientId, body);
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
      <label className="block text-sm font-medium text-[var(--color-foreground)]" htmlFor="teacher-msg-to">
        {labels.messagesComposeTo}
      </label>
      <RecipientAutocomplete
        id="teacher-msg-to"
        options={recipients}
        value={recipientId}
        onValueChange={setRecipientId}
        disabled={busy}
        placeholder={labels.messagesRecipientSearchPlaceholder}
        noMatchesText={labels.messagesRecipientNoMatches}
        emptyOptionsText={labels.messagesRecipientListEmpty}
        roleLabels={roleLabels}
        ariaLabel={labels.messagesComposeTo}
        inputTitle={labels.tipComposeRecipient}
      />
      <RichTextEditor
        value={body}
        onChange={setBody}
        disabled={busy}
        title={labels.tipComposeBody}
        aria-label={labels.messagesComposeAria}
      />
      <Button
        type="submit"
        disabled={busy}
        isLoading={busy}
        className="min-h-[44px]"
        title={labels.tipComposeSend}
      >
        {!busy ? <Send className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {labels.messagesComposeSend}
      </Button>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </form>
  );
}
