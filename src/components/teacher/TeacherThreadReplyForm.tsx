"use client";

import { PenLine, Send } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { replyToStudentMessage } from "@/app/[locale]/dashboard/teacher/messages/actions";
import { Button } from "@/components/atoms/Button";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import type { TeacherFeedRow } from "@/components/teacher/TeacherMessagesFeed";
import type { Dictionary } from "@/types/i18n";

interface TeacherThreadReplyFormProps {
  locale: string;
  row: TeacherFeedRow;
  labels: Dictionary["dashboard"]["teacher"];
  onCancel: () => void;
  onSent: () => void;
}

export function TeacherThreadReplyForm({
  locale,
  row,
  labels,
  onCancel,
  onSent,
}: TeacherThreadReplyFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("<p></p>");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onReply() {
    setBusy(true);
    setMsg(null);
    const res = await replyToStudentMessage(locale, row.id, body);
    setBusy(false);
    if (res.ok) {
      setBody("<p></p>");
      router.refresh();
      onSent();
      return;
    }
    setMsg(`${labels.messagesError}${res.message ? `: ${res.message}` : ""}`);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.messagesFrom}: {row.peerName}
      </p>
      <RichTextEditor
        value={body}
        onChange={setBody}
        disabled={busy}
        aria-label={labels.messagesReplyPlaceholder}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          disabled={busy}
          isLoading={busy}
          className="min-h-[44px] w-full sm:w-auto"
          onClick={() => void onReply()}
        >
          {busy ? null : <Send className="h-4 w-4 shrink-0" aria-hidden />}
          {labels.messagesSendReply}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          className="min-h-[44px] w-full sm:w-auto"
          onClick={onCancel}
        >
          <PenLine className="h-4 w-4 shrink-0" aria-hidden />
          {labels.messagesReplyCancel}
        </Button>
      </div>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </div>
  );
}
