"use client";

import { Reply } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

const htmlBlockClass =
  "max-w-none text-sm leading-relaxed text-[var(--color-foreground)] [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5";

export type ParentReplyTarget = {
  recipientId: string;
  recipientRole: "admin" | "teacher";
  recipientName: string;
};

export type ParentMessageLineDto = {
  id: string;
  from_me: boolean;
  body_html: string;
  created_at: string;
  peer_id: string;
  peer_role: string;
  peer_name: string;
  incoming_label: string;
  outbound_administration?: boolean;
};

function replyTargetFor(row: ParentMessageLineDto): ParentReplyTarget | null {
  if (row.from_me) return null;
  if (row.peer_role !== "admin" && row.peer_role !== "teacher") return null;
  if (!row.peer_id) return null;
  return {
    recipientId: row.peer_id,
    recipientRole: row.peer_role,
    recipientName: row.peer_name,
  };
}

interface ParentMessagesFeedProps {
  rows?: ParentMessageLineDto[];
  labels: Dictionary["dashboard"]["parent"];
  onReply?: (target: ParentReplyTarget) => void;
  /** Phone thread uses bubbles. Wide screens keep bordered cards. */
  layout?: "cards" | "thread";
}

export function ParentMessagesFeed({
  rows = [],
  labels,
  onReply,
  layout = "cards",
}: ParentMessagesFeedProps) {
  const thread = layout === "thread";
  return (
    <div className={thread ? "space-y-3" : "space-y-6"}>
      {thread ? null : (
        <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
          {labels.messagesFeedTitle}
        </h2>
      )}
      <ul className={thread ? "flex flex-col gap-2" : "space-y-4"}>
        {rows.length === 0 ? (
          <li className="text-sm text-[var(--color-muted-foreground)]">{labels.messagesEmpty}</li>
        ) : (
          rows.map((m) => {
            const replyTarget = onReply ? replyTargetFor(m) : null;
            return (
            <li
              key={m.id}
              className={
                thread
                  ? `max-w-[85%] rounded-2xl px-3 py-2 ${
                      m.from_me
                        ? "ml-auto bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))]"
                        : "mr-auto bg-[var(--color-muted)]"
                    }`
                  : `rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-4 ${
                      m.from_me
                        ? "ml-4 border-[var(--color-primary)]/30 bg-[var(--color-surface)]"
                        : "mr-4 bg-[var(--color-muted)]/40"
                    }`
              }
            >
              <p className="text-xs uppercase text-[var(--color-muted-foreground)]">
                {new Date(m.created_at).toLocaleString()}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                {m.from_me
                  ? m.outbound_administration ||
                      m.peer_name === labels.administrationPeerLabel
                    ? (labels.messagesYouSentToAdministration ??
                      `${labels.messagesYouSentTo}: ${labels.administrationPeerLabel}`)
                    : `${labels.messagesYouSentTo}: ${m.peer_name}`
                  : `${m.incoming_label}: ${m.peer_name}`}
              </p>
              <div className={htmlBlockClass} dangerouslySetInnerHTML={{ __html: m.body_html }} />
              {replyTarget && onReply ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-3 min-h-[44px]"
                  title={labels.messagesReplyTitle}
                  onClick={() => onReply(replyTarget)}
                >
                  <Reply className="h-4 w-4 shrink-0" aria-hidden />
                  {labels.messagesReply}
                </Button>
              ) : null}
            </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
