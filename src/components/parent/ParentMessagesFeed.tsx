"use client";

import type { Dictionary } from "@/types/i18n";

const htmlBlockClass =
  "max-w-none text-sm leading-relaxed text-[var(--color-foreground)] [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5";

export type ParentMessageLineDto = {
  id: string;
  from_me: boolean;
  body_html: string;
  created_at: string;
  peer_name: string;
  incoming_label: string;
};

interface ParentMessagesFeedProps {
  rows?: ParentMessageLineDto[];
  labels: Dictionary["dashboard"]["parent"];
}

export function ParentMessagesFeed({ rows = [], labels }: ParentMessagesFeedProps) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
        {labels.messagesFeedTitle}
      </h2>
      <ul className="space-y-4">
        {rows.length === 0 ? (
          <li className="text-sm text-[var(--color-muted-foreground)]">{labels.messagesEmpty}</li>
        ) : (
          rows.map((m) => (
            <li
              key={m.id}
              className={`rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-4 ${
                m.from_me
                  ? "ml-4 border-[var(--color-primary)]/30 bg-[var(--color-surface)]"
                  : "mr-4 bg-[var(--color-muted)]/40"
              }`}
            >
              <p className="text-xs uppercase text-[var(--color-muted-foreground)]">
                {new Date(m.created_at).toLocaleString()}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                {m.from_me
                  ? `${labels.messagesYouSentTo}: ${m.peer_name}`
                  : `${m.incoming_label}: ${m.peer_name}`}
              </p>
              <div className={htmlBlockClass} dangerouslySetInnerHTML={{ __html: m.body_html }} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
