"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendTeacherMessage } from "@/app/[locale]/dashboard/teacher/messages/actions";
import { Button } from "@/components/atoms/Button";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import type { Dictionary } from "@/types/i18n";

export type MessagingRecipient = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
};

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

  const students = recipients.filter((r) => r.role === "student");
  const teachers = recipients.filter((r) => r.role === "teacher");
  const admins = recipients.filter((r) => r.role === "admin");

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
      className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
        {labels.messagesComposeTitle}
      </h2>
      <label className="block text-sm font-medium text-[var(--color-foreground)]" htmlFor="teacher-msg-to">
        {labels.messagesComposeTo}
      </label>
      <select
        id="teacher-msg-to"
        className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        value={recipientId}
        onChange={(e) => setRecipientId(e.target.value)}
        disabled={busy}
        required
      >
        <option value="">{labels.messagesRecipientPlaceholder}</option>
        {students.length > 0 ? (
          <optgroup label={labels.messagesRoleStudent}>
            {students.map((r) => (
              <option key={r.id} value={r.id}>
                {`${r.first_name} ${r.last_name}`.trim()}
              </option>
            ))}
          </optgroup>
        ) : null}
        {teachers.length > 0 ? (
          <optgroup label={labels.messagesRoleTeacher}>
            {teachers.map((r) => (
              <option key={r.id} value={r.id}>
                {`${r.first_name} ${r.last_name}`.trim()}
              </option>
            ))}
          </optgroup>
        ) : null}
        {admins.length > 0 ? (
          <optgroup label={labels.messagesRoleAdmin}>
            {admins.map((r) => (
              <option key={r.id} value={r.id}>
                {`${r.first_name} ${r.last_name}`.trim()}
              </option>
            ))}
          </optgroup>
        ) : null}
      </select>
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
