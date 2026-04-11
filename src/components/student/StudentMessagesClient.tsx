"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteStudentMessage,
  sendStudentMessage,
} from "@/app/[locale]/dashboard/student/messages/actions";
import { Button } from "@/components/atoms/Button";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import type { Dictionary } from "@/types/i18n";

const htmlBlockClass =
  "max-w-none text-sm leading-relaxed text-[var(--color-foreground)] [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5";

export type StudentMessageDto = {
  id: string;
  body_html: string;
  reply_html: string | null;
  created_at: string;
  replied_at: string | null;
};

interface StudentMessagesClientProps {
  locale: string;
  initialMessages: StudentMessageDto[];
  labels: Dictionary["dashboard"]["student"];
}

export function StudentMessagesClient({
  locale,
  initialMessages,
  labels,
}: StudentMessagesClientProps) {
  const router = useRouter();
  const [body, setBody] = useState("<p></p>");
  const [composeKey, setComposeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await sendStudentMessage(locale, body);
    setBusy(false);
    if (res.ok) {
      setMsg(labels.messagesSentOk);
      setBody("<p></p>");
      setComposeKey((k) => k + 1);
      router.refresh();
    } else {
      setMsg(`${labels.messagesError}${res.message ? `: ${res.message}` : ""}`);
    }
  }

  async function onDelete(id: string) {
    setBusy(true);
    const res = await deleteStudentMessage(locale, id);
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setMsg(labels.messagesError);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSend} className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
          {labels.messagesCompose}
        </h2>
        <RichTextEditor
          key={composeKey}
          value={body}
          onChange={setBody}
          disabled={busy}
          aria-label={labels.messagesPlaceholder}
        />
        <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px]">
          {labels.messagesSend}
        </Button>
      </form>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}

      <ul className="space-y-6">
        {initialMessages.length === 0 ? (
          <li className="text-sm text-[var(--color-muted-foreground)]">{labels.messagesEmpty}</li>
        ) : (
          initialMessages.map((m) => (
            <li
              key={m.id}
              className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <p className="text-xs uppercase text-[var(--color-muted-foreground)]">
                {new Date(m.created_at).toLocaleString()}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                {labels.messagesYouSent}
              </p>
              <div className={htmlBlockClass} dangerouslySetInnerHTML={{ __html: m.body_html }} />
              {m.reply_html ? (
                <>
                  <p className="mt-4 text-sm font-semibold text-[var(--color-secondary)]">
                    {labels.messagesReplyFromTeacher}
                  </p>
                  <div className={htmlBlockClass} dangerouslySetInnerHTML={{ __html: m.reply_html }} />
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-3 min-h-[44px]"
                  disabled={busy}
                  onClick={() => onDelete(m.id)}
                >
                  {labels.messagesDelete}
                </Button>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
