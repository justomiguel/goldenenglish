"use client";

import { PenLine, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendParentReply } from "@/app/[locale]/dashboard/parent/messages/actions";
import { Button } from "@/components/atoms/Button";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import type { ParentReplyTarget } from "@/components/parent/ParentMessagesFeed";
import type { Dictionary } from "@/types/i18n";

export interface ParentMessageReplyFormProps {
  locale: string;
  target: ParentReplyTarget;
  labels: Dictionary["dashboard"]["parent"];
  onCancel: () => void;
  onSentSuccess?: () => void;
  className?: string;
  showHeading?: boolean;
}

export function ParentMessageReplyForm({
  locale,
  target,
  labels,
  onCancel,
  onSentSuccess,
  className = "space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm md:p-5",
  showHeading = true,
}: ParentMessageReplyFormProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLFormElement>(null);
  const [body, setBody] = useState("<p></p>");
  const [composeKey, setComposeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const heading = labels.messagesReplyHeading.replace("{name}", target.recipientName);
  const hint = labels.messagesReplyHint.replace("{name}", target.recipientName);

  useEffect(() => {
    rootRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [target.recipientId]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await sendParentReply(locale, body, target.recipientId);
    setBusy(false);
    if (res.ok) {
      setMsg(labels.messagesComposeSent);
      setBody("<p></p>");
      setComposeKey((k) => k + 1);
      router.refresh();
      onSentSuccess?.();
    } else {
      setMsg(`${labels.messagesComposeError}${res.message ? `: ${res.message}` : ""}`);
    }
  }

  return (
    <form ref={rootRef} onSubmit={onSend} className={className}>
      {showHeading ? (
        <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">{heading}</h2>
      ) : null}
      <p className="text-sm leading-snug text-[var(--color-muted-foreground)]">{hint}</p>
      <RichTextEditor
        key={`${composeKey}-${target.recipientId}`}
        value={body}
        onChange={setBody}
        disabled={busy}
        title={labels.tipComposeBody}
        aria-label={labels.messagesComposeAria}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={busy}
          isLoading={busy}
          className="min-h-[44px] w-full sm:w-auto"
          title={labels.messagesReplyTitle}
        >
          {!busy ? <Send className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {labels.messagesReplySend}
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
    </form>
  );
}
