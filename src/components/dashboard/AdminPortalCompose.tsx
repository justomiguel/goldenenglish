"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendAdminMessage } from "@/app/[locale]/dashboard/admin/messages/actions";
import { Button } from "@/components/atoms/Button";
import { RecipientAutocomplete } from "@/components/molecules/RecipientAutocomplete";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import type { MessagingRecipient } from "@/types/messaging";
import type { Dictionary } from "@/types/i18n";

interface AdminPortalComposeProps {
  locale: string;
  recipients: MessagingRecipient[];
  labels: Dictionary["admin"]["messages"];
}

export function AdminPortalCompose({ locale, recipients, labels }: AdminPortalComposeProps) {
  const router = useRouter();
  const [recipientId, setRecipientId] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const roleLabels = {
    student: labels.roleStudent,
    parent: labels.roleParent,
    teacher: labels.roleTeacher,
    admin: labels.roleAdmin,
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientId) return;
    setBusy(true);
    setMsg(null);
    const res = await sendAdminMessage(locale, recipientId, body);
    setBusy(false);
    if (res.ok) {
      setMsg(labels.composeSent);
      setBody("<p></p>");
      setRecipientId("");
      router.refresh();
    } else {
      setMsg(`${labels.composeError}${res.message ? `: ${res.message}` : ""}`);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 overflow-visible rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <h2 className="text-lg font-semibold text-[var(--color-secondary)]">{labels.composeTitle}</h2>
      <label className="block text-sm font-medium text-[var(--color-foreground)]" htmlFor="admin-msg-to">
        {labels.composeTo}
      </label>
      <RecipientAutocomplete
        id="admin-msg-to"
        options={recipients}
        value={recipientId}
        onValueChange={setRecipientId}
        disabled={busy}
        placeholder={labels.recipientSearchPlaceholder}
        noMatchesText={labels.recipientNoMatches}
        emptyOptionsText={labels.recipientListEmpty}
        roleLabels={roleLabels}
        ariaLabel={labels.composeTo}
        inputTitle={labels.tipComposeRecipient}
      />
      <RichTextEditor
        value={body}
        onChange={setBody}
        disabled={busy}
        title={labels.tipComposeBody}
        aria-label={labels.composeAria}
      />
      <Button
        type="submit"
        disabled={busy}
        isLoading={busy}
        className="min-h-[44px]"
        title={labels.tipComposeSend}
      >
        {labels.composeSend}
      </Button>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </form>
  );
}
