"use client";

import { useState } from "react";
import { emailTemplateBodyPrefersCodeEditor } from "@/lib/email/emailTemplateBodyPrefersCodeEditor";
import { Code, LayoutPanelLeft } from "lucide-react";
import { Label } from "@/components/atoms/Label";
import { Button } from "@/components/atoms/Button";
import { EmailTemplateTiptapBody } from "./EmailTemplateTiptapBody";
import type { EmailTemplatesShellLabels } from "@/components/dashboard/admin/communications/EmailTemplatesShell";

export type EmailTemplateBodyFieldLabels = EmailTemplatesShellLabels["bodyField"];
export type EmailTemplateTiptapLabels = NonNullable<EmailTemplateBodyFieldLabels["tiptap"]>;

export interface EmailTemplateBodyFieldProps {
  bodyLabel: string;
  bodyHelp: string;
  bodyField: EmailTemplateBodyFieldLabels;
  bodyHtml: string;
  onBodyChange: (value: string) => void;
  disabled?: boolean;
}

export function EmailTemplateBodyField({
  bodyLabel,
  bodyHelp,
  bodyField,
  bodyHtml,
  onBodyChange,
  disabled,
}: EmailTemplateBodyFieldProps) {
  const [mode, setMode] = useState<"visual" | "code">(() =>
    emailTemplateBodyPrefersCodeEditor(bodyHtml) ? "code" : "visual",
  );

  const showVisualWarning = mode === "visual" && emailTemplateBodyPrefersCodeEditor(bodyHtml);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Label
          htmlFor={mode === "code" ? "email-template-body-code" : "email-template-body-wysiwyg"}
        >
          {bodyLabel}
        </Label>
        <div className="flex gap-0.5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-0.5" role="group" aria-label={bodyField.modeGroupLabel}>
          <Button
            type="button"
            variant={mode === "visual" ? "secondary" : "ghost"}
            size="sm"
            disabled={disabled}
            onClick={() => setMode("visual")}
            className="!px-2"
            aria-pressed={mode === "visual"}
          >
            <LayoutPanelLeft className="h-4 w-4 shrink-0" aria-hidden />
            {bodyField.modeVisual}
          </Button>
          <Button
            type="button"
            variant={mode === "code" ? "secondary" : "ghost"}
            size="sm"
            disabled={disabled}
            onClick={() => setMode("code")}
            className="!px-2"
            aria-pressed={mode === "code"}
          >
            <Code className="h-4 w-4 shrink-0" aria-hidden />
            {bodyField.modeCode}
          </Button>
        </div>
      </div>

      {mode === "visual" ? (
        <EmailTemplateTiptapBody value={bodyHtml} onChange={onBodyChange} disabled={disabled} tiptap={bodyField.tiptap} />
      ) : (
        <textarea
          id="email-template-body-code"
          value={bodyHtml}
          onChange={(e) => onBodyChange(e.target.value)}
          disabled={disabled}
          rows={16}
          spellCheck={false}
          className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--color-foreground)]"
        />
      )}

      {showVisualWarning ? <p className="text-xs text-[var(--color-error)]">{bodyField.visualStructureWarning}</p> : null}
      <p className="text-xs text-[var(--color-muted-foreground)]">{bodyHelp}</p>
      <p className="text-xs text-[var(--color-muted-foreground)]">{bodyField.codeTabHint}</p>
    </div>
  );
}
