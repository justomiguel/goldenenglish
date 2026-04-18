"use client";

import type { EmailTemplatesShellLabels } from "./EmailTemplatesShell";

export interface EmailTemplatePreviewProps {
  labels: EmailTemplatesShellLabels;
  subject: string;
  html: string;
}

export function EmailTemplatePreview({ labels, subject, html }: EmailTemplatePreviewProps) {
  return (
    <aside
      aria-label={labels.previewTitle}
      className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {labels.previewSubjectLabel}
        </p>
        <p className="mt-1 text-sm font-semibold text-[var(--color-secondary)] break-words">
          {subject || labels.previewEmptySubject}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {labels.previewTitle}
        </p>
        <iframe
          title={labels.previewTitle}
          srcDoc={html}
          sandbox=""
          className="mt-2 h-[520px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-white"
        />
      </div>
    </aside>
  );
}
