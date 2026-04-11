"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { replyToStudentMessage } from "@/app/[locale]/dashboard/teacher/messages/actions";
import { Button } from "@/components/atoms/Button";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import type { Dictionary } from "@/types/i18n";

const htmlBlockClass =
  "max-w-none text-sm leading-relaxed text-[var(--color-foreground)] [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5";

export type TeacherMessageDto = {
  id: string;
  studentId: string;
  studentName: string;
  body_html: string;
  reply_html: string | null;
  created_at: string;
  replied_at: string | null;
};

interface TeacherMessagesClientProps {
  locale: string;
  initialMessages: TeacherMessageDto[];
  labels: Dictionary["dashboard"]["teacher"];
}

export function TeacherMessagesClient({
  locale,
  initialMessages,
  labels,
}: TeacherMessagesClientProps) {
  const router = useRouter();
  const [bodyById, setBodyById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function getReply(id: string): string {
    return bodyById[id] ?? "<p></p>";
  }

  function setReply(id: string, html: string) {
    setBodyById((prev) => ({ ...prev, [id]: html }));
  }

  async function onReply(messageId: string) {
    setBusyId(messageId);
    setMsg(null);
    const res = await replyToStudentMessage(locale, messageId, getReply(messageId));
    setBusyId(null);
    if (res.ok) {
      setMsg(labels.messagesReplyOk);
      setReply(messageId, "<p></p>");
      router.refresh();
    } else {
      setMsg(`${labels.messagesError}${res.message ? `: ${res.message}` : ""}`);
    }
  }

  return (
    <div className="space-y-8">
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
      <ul className="space-y-6">
        {initialMessages.length === 0 ? (
          <li className="text-sm text-[var(--color-muted-foreground)]">{labels.messagesNoMessages}</li>
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
                {labels.messagesFrom}: {m.studentName}
              </p>
              <div className={htmlBlockClass} dangerouslySetInnerHTML={{ __html: m.body_html }} />
              {m.reply_html ? (
                <>
                  <p className="mt-4 text-sm font-semibold text-[var(--color-secondary)]">
                    {labels.messagesYourReply}
                  </p>
                  <div className={htmlBlockClass} dangerouslySetInnerHTML={{ __html: m.reply_html }} />
                </>
              ) : (
                <div className="mt-4 space-y-2">
                  <RichTextEditor
                    value={getReply(m.id)}
                    onChange={(html) => setReply(m.id, html)}
                    disabled={busyId === m.id}
                    aria-label={labels.messagesReplyPlaceholder}
                  />
                  <Button
                    type="button"
                    disabled={busyId === m.id}
                    isLoading={busyId === m.id}
                    className="min-h-[44px]"
                    onClick={() => onReply(m.id)}
                  >
                    {labels.messagesSendReply}
                  </Button>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
