"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fillTemplate } from "@/lib/i18n/fillTemplate";
import { wrapEmailHtml } from "@/lib/email/templates/wrapEmailHtml";
import { resetEmailTemplateAction, saveEmailTemplateAction, type EmailTemplateActionErrorCode } from "@/app/[locale]/dashboard/admin/communications/templates/actions";
import type { Dictionary, Locale } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { EmailTemplateEditor } from "./EmailTemplateEditor";
import { EmailTemplatePreview } from "./EmailTemplatePreview";
import { buildBrandForPreview, buildSampleVars, defaultsFor, type EmailTemplatesShellBrand, type EmailTemplatesShellEntry } from "./emailTemplateShellHelpers";

export type { EmailTemplatesShellBrand, EmailTemplatesShellEntry } from "./emailTemplateShellHelpers";

export type EmailTemplatesShellLabels =
  Dictionary["admin"]["communications"]["templates"];

export interface EmailTemplatesShellProps {
  locale: string;
  labels: EmailTemplatesShellLabels;
  entries: EmailTemplatesShellEntry[];
  brand: EmailTemplatesShellBrand;
  origin: string;
}

interface SelectedKey {
  templateKey: string;
  templateLocale: Locale;
}

export function EmailTemplatesShell({
  locale,
  labels,
  entries,
  brand,
  origin,
}: EmailTemplatesShellProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errorCode, setErrorCode] = useState<EmailTemplateActionErrorCode | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const initialKey: SelectedKey = entries.length
    ? { templateKey: entries[0].definition.key, templateLocale: "es" }
    : { templateKey: "", templateLocale: "es" };
  const [selected, setSelected] = useState<SelectedKey>(initialKey);

  const selectedEntry = useMemo(
    () => entries.find((e) => e.definition.key === selected.templateKey) ?? null,
    [entries, selected.templateKey],
  );

  const initialDraft = selectedEntry
    ? defaultsFor(selectedEntry, selected.templateLocale)
    : { subject: "", bodyHtml: "" };

  const [draftSubject, setDraftSubject] = useState(initialDraft.subject);
  const [draftBody, setDraftBody] = useState(initialDraft.bodyHtml);

  function changeSelection(next: SelectedKey) {
    const nextEntry = entries.find((e) => e.definition.key === next.templateKey);
    if (!nextEntry) return;
    const def = defaultsFor(nextEntry, next.templateLocale);
    setSelected(next);
    setDraftSubject(def.subject);
    setDraftBody(def.bodyHtml);
    setErrorCode(null);
    setSavedAt(null);
  }

  function onSelectChange(value: string) {
    const [k, l] = value.split("::");
    if (!k || (l !== "es" && l !== "en")) return;
    changeSelection({ templateKey: k, templateLocale: l });
  }

  function handleSave() {
    if (!selectedEntry) return;
    startTransition(async () => {
      const result = await saveEmailTemplateAction({
        locale,
        templateKey: selected.templateKey,
        templateLocale: selected.templateLocale,
        subject: draftSubject,
        bodyHtml: draftBody,
      });
      if (result.ok) {
        setErrorCode(null);
        setSavedAt(Date.now());
        router.refresh();
      } else {
        setErrorCode(result.code);
      }
    });
  }

  function handleReset() {
    if (!selectedEntry) return;
    if (!window.confirm(labels.confirmReset)) return;
    startTransition(async () => {
      const result = await resetEmailTemplateAction({
        locale,
        templateKey: selected.templateKey,
        templateLocale: selected.templateLocale,
      });
      if (result.ok) {
        setErrorCode(null);
        setSavedAt(Date.now());
        const def = selectedEntry.definition.defaults[selected.templateLocale];
        setDraftSubject(def.subject);
        setDraftBody(def.bodyHtml);
        router.refresh();
      } else {
        setErrorCode(result.code);
      }
    });
  }

  const sampleVars = selectedEntry ? buildSampleVars(selectedEntry.definition) : {};
  const brandForPreview = useMemo(() => buildBrandForPreview(brand), [brand]);
  const previewHtml = selectedEntry
    ? wrapEmailHtml({
        brand: brandForPreview,
        origin,
        locale: selected.templateLocale,
        bodyHtml: fillTemplate(draftBody, sampleVars),
      })
    : "";
  const previewSubject = fillTemplate(draftSubject, sampleVars);

  const dirty =
    selectedEntry !== null &&
    (draftSubject !== defaultsFor(selectedEntry, selected.templateLocale).subject ||
      draftBody !== defaultsFor(selectedEntry, selected.templateLocale).bodyHtml);

  if (!selectedEntry) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.emptyCatalog}</p>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Label htmlFor="email-template-select">{labels.selectLabel}</Label>
        <select
          id="email-template-select"
          value={`${selected.templateKey}::${selected.templateLocale}`}
          onChange={(e) => onSelectChange(e.target.value)}
          className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          {entries.map((entry) =>
            (["es", "en"] as Locale[]).map((loc) => (
              <option key={`${entry.definition.key}::${loc}`} value={`${entry.definition.key}::${loc}`}>
                {entry.definition.label[loc === "es" ? "es" : "en"]} — {labels.localeLabel[loc]}
                {entry.overridesByLocale[loc] ? ` ${labels.editedSuffix}` : ""}
              </option>
            )),
          )}
        </select>

        <p className="text-xs text-[var(--color-muted-foreground)]">
          {selectedEntry.definition.description[selected.templateLocale === "es" ? "es" : "en"]}
        </p>

        <EmailTemplateEditor
          labels={labels}
          definition={selectedEntry.definition}
          locale={selected.templateLocale}
          subject={draftSubject}
          bodyHtml={draftBody}
          onSubjectChange={(v) => {
            setDraftSubject(v);
            setSavedAt(null);
            setErrorCode(null);
          }}
          onBodyChange={(v) => {
            setDraftBody(v);
            setSavedAt(null);
            setErrorCode(null);
          }}
          disabled={pending}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={pending || !dirty}
            isLoading={pending}
          >
            {labels.saveCta}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={pending}>
            {labels.resetCta}
          </Button>
          {errorCode ? (
            <span role="alert" className="text-sm text-[var(--color-error)]">
              {labels.errors[errorCode] ?? labels.errors.persist_failed}
            </span>
          ) : null}
          {savedAt && !pending && !errorCode ? (
            <span role="status" className="text-sm text-[var(--color-success)]">
              {labels.saveSuccess}
            </span>
          ) : null}
        </div>
      </div>

      <EmailTemplatePreview
        labels={labels}
        subject={previewSubject}
        html={previewHtml}
      />
    </section>
  );
}
