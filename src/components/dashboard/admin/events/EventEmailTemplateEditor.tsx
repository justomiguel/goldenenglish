"use client";

import { useState } from "react";
import { Braces, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import {
  EmailTemplateBodyField,
  type EmailTemplateBodyFieldLabels,
} from "@/components/molecules/EmailTemplateBodyField";
import { sanitizeEmailTemplateHtml } from "@/lib/email/sanitizeEmailTemplateHtml";
import {
  EVENT_EMAIL_LOCALES,
  EVENT_EMAIL_TEMPLATE_KEYS,
  EVENT_EMAIL_VARIABLES,
  applyEventEmailVars,
  eventEmailAllowsFlow,
  pickEventEmailCopy,
  type EventEmailCopyRow,
  type EventEmailLocale,
  type EventEmailTemplateKey,
  type EventEmailVariable,
} from "@/lib/events/eventEmailCopy";
import { useSaveEventEmailTemplate } from "@/hooks/useSaveEventEmailTemplate";

export interface EventEmailTemplateLabels {
  mailLabel: string;
  mails: Record<"registered" | "paymentApproved" | "paymentRejected" | "reminder" | "registrationRemoved", string>;
  localeLabel: string;
  scopeLabel: string;
  scopeEvent: string;
  subjectLabel: string;
  bodyLabel: string;
  bodyHelp: string;
  save: string;
  saved: string;
  errorSave: string;
  errorValidation: string;
  previewTitle: string;
  variablesLabel: string;
  variables: Record<EventEmailVariable, string>;
  previewSamples: Record<EventEmailVariable, string>;
}

const MAIL_LABEL_KEY = {
  "events.registered": "registered",
  "events.payment_approved": "paymentApproved",
  "events.payment_rejected": "paymentRejected",
  "events.reminder": "reminder",
  "events.registration_removed": "registrationRemoved",
} as const;

const fieldClass =
  "min-h-[36px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]";

interface EventEmailTemplateEditorProps {
  eventId: string;
  pageLocale: string;
  flows: { id: string; name: string }[];
  copies: EventEmailCopyRow[];
  fallbacks: Record<EventEmailTemplateKey, Record<EventEmailLocale, { subject: string; bodyHtml: string }>>;
  bodyField: EmailTemplateBodyFieldLabels;
  labels: EventEmailTemplateLabels;
}

export function EventEmailTemplateEditor({
  eventId,
  pageLocale,
  flows,
  copies,
  fallbacks,
  bodyField,
  labels,
}: EventEmailTemplateEditorProps) {
  const { pending, notice, save } = useSaveEventEmailTemplate();
  const [templateKey, setTemplateKey] = useState<EventEmailTemplateKey>("events.registered");
  const [mailLocale, setMailLocale] = useState<EventEmailLocale>(
    pageLocale === "en" || pageLocale === "pt" ? pageLocale : "es",
  );
  const [flowScope, setFlowScope] = useState("");
  const flowId = eventEmailAllowsFlow(templateKey) && flowScope ? flowScope : null;
  const selection = `${templateKey}|${mailLocale}|${flowId ?? ""}`;
  const draft =
    pickEventEmailCopy(copies, { templateKey, locale: mailLocale, flowId }) ??
    fallbacks[templateKey][mailLocale];
  const [seen, setSeen] = useState(selection);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.bodyHtml);
  if (seen !== selection) {
    setSeen(selection);
    setSubject(draft.subject);
    setBody(draft.bodyHtml);
  }

  const preview = applyEventEmailVars({ subject, bodyHtml: body }, labels.previewSamples);
  const previewHtml = sanitizeEmailTemplateHtml(preview.bodyHtml);
  const showFlow = eventEmailAllowsFlow(templateKey) && flows.length > 0;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save({ eventId, templateKey, locale: mailLocale, flowId, subject, bodyHtml: body });
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-[var(--color-foreground)]">{labels.mailLabel}</span>
          <select
            className={fieldClass}
            aria-label={labels.mailLabel}
            value={templateKey}
            onChange={(event) => setTemplateKey(event.target.value as EventEmailTemplateKey)}
          >
            {EVENT_EMAIL_TEMPLATE_KEYS.map((key) => (
              <option key={key} value={key}>
                {labels.mails[MAIL_LABEL_KEY[key]]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-[var(--color-foreground)]">{labels.localeLabel}</span>
          <select
            className={fieldClass}
            aria-label={labels.localeLabel}
            value={mailLocale}
            onChange={(event) => setMailLocale(event.target.value as EventEmailLocale)}
          >
            {EVENT_EMAIL_LOCALES.map((locale) => (
              <option key={locale} value={locale}>
                {locale}
              </option>
            ))}
          </select>
        </label>
      </div>
      {showFlow ? (
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-[var(--color-foreground)]">{labels.scopeLabel}</span>
          <select
            className={fieldClass}
            aria-label={labels.scopeLabel}
            value={flowScope}
            onChange={(event) => setFlowScope(event.target.value)}
          >
            <option value="">{labels.scopeEvent}</option>
            {flows.map((flow) => (
              <option key={flow.id} value={flow.id}>
                {flow.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block space-y-1 text-sm">
        <Label htmlFor="event-email-subject">{labels.subjectLabel}</Label>
        <Input
          id="event-email-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
      </label>
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--color-foreground)]">{labels.variablesLabel}</p>
        <div className="flex flex-wrap gap-2">
          {EVENT_EMAIL_VARIABLES.map((token) => (
            <Button
              key={token}
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-[36px]"
              onClick={() => setBody((current) => insertEmailToken(current, token))}
            >
              <Braces className="h-4 w-4" aria-hidden />
              {labels.variables[token]}
            </Button>
          ))}
        </div>
      </div>
      <EmailTemplateBodyField
        bodyLabel={labels.bodyLabel}
        bodyHelp={labels.bodyHelp}
        bodyField={bodyField}
        bodyHtml={body}
        onBodyChange={setBody}
        disabled={pending}
      />
      <section className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.previewTitle}</h3>
        <p className="text-sm text-[var(--color-foreground)]">{preview.subject}</p>
        <div
          className="text-sm text-[var(--color-foreground)]"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </section>
      {notice === "saved" ? (
        <p role="status" className="text-sm text-[var(--color-foreground)]">
          {labels.saved}
        </p>
      ) : null}
      {notice === "validation" || notice === "error" ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {notice === "validation" ? labels.errorValidation : labels.errorSave}
        </p>
      ) : null}
      <Button type="submit" className="min-h-[36px]" isLoading={pending} disabled={pending}>
        <Save className="h-4 w-4" aria-hidden />
        {labels.save}
      </Button>
    </form>
  );
}

function insertEmailToken(html: string, token: string): string {
  const marker = `{{${token}}}`;
  if (html.endsWith("</p>")) return `${html.slice(0, -4)}${marker}</p>`;
  return `${html}${marker}`;
}
