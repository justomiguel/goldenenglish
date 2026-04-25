"use client";

import type { EmailTemplateDefinition } from "@/types/emailTemplates";
import type { Locale } from "@/types/i18n";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { EmailTemplateBodyField } from "@/components/molecules/EmailTemplateBodyField";
import type { EmailTemplatesShellLabels } from "./EmailTemplatesShell";

export interface EmailTemplateEditorProps {
  labels: EmailTemplatesShellLabels;
  definition: EmailTemplateDefinition;
  locale: Locale;
  subject: string;
  bodyHtml: string;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  disabled?: boolean;
}

export function EmailTemplateEditor({
  labels,
  definition,
  locale,
  subject,
  bodyHtml,
  onSubjectChange,
  onBodyChange,
  disabled,
}: EmailTemplateEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email-template-subject">{labels.subjectLabel}</Label>
        <Input
          id="email-template-subject"
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          disabled={disabled}
          maxLength={300}
        />
      </div>

      <EmailTemplateBodyField
        key={`${definition.key}::${locale}`}
        bodyLabel={labels.bodyLabel}
        bodyHelp={labels.bodyHelp}
        bodyField={labels.bodyField}
        bodyHtml={bodyHtml}
        onBodyChange={onBodyChange}
        disabled={disabled}
      />

      {definition.placeholders.length > 0 ? (
        <details className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-[var(--color-secondary)]">
            {labels.placeholdersTitle} ({definition.placeholders.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {definition.placeholders.map((p) => (
              <li key={p.name} className="text-[var(--color-muted-foreground)]">
                <code className="rounded bg-[var(--color-muted)] px-1 py-0.5 text-[var(--color-foreground)]">
                  {`{{${p.name}}}`}
                </code>{" "}
                — {p.description}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
