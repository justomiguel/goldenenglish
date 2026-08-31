"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { AdminBackLink } from "@/components/dashboard/AdminBackLink";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { QuestionnaireQuestionAddPanel } from "@/components/dashboard/admin/questionnaires/QuestionnaireQuestionAddPanel";
import { QuestionnaireQuestionList } from "@/components/dashboard/admin/questionnaires/QuestionnaireQuestionList";
import { updateQuestionnaireMetaAction } from "@/app/[locale]/dashboard/admin/settings/questionnaires/actions";
import { pickI18n } from "@/lib/questionnaires/pickI18n";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import type { QuestionnaireQuestion, QuestionnaireRecord, QuestionnaireStatus, QuestionnaireVisibility } from "@/lib/questionnaires/types";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["questionnaires"];

export function QuestionnaireEditorShell({
  locale,
  questionnaire,
  questions,
  labels,
}: {
  locale: string;
  questionnaire: QuestionnaireRecord;
  questions: QuestionnaireQuestion[];
  labels: Labels;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(pickI18n(questionnaire.titleI18n, defaultLocale));
  const [description, setDescription] = useState(pickI18n(questionnaire.descriptionI18n, defaultLocale));
  const [slug, setSlug] = useState(questionnaire.slug);
  const [status, setStatus] = useState(questionnaire.status);
  const [visibility, setVisibility] = useState(questionnaire.visibility);
  const [limitOne, setLimitOne] = useState(questionnaire.limitOneResponse);
  const [showLanding, setShowLanding] = useState(questionnaire.showOnLanding);
  const slugLocked = Boolean(questionnaire.publishedAt);

  return (
    <div className="space-y-8">
      <AdminBackLink href={`/${locale}/dashboard/admin/settings/questionnaires`}>
        {labels.backToList}
      </AdminBackLink>
      <AdminPageHeader title={labels.editorTitle} iconId="questionnaires" />
      <form
        className="grid gap-4 rounded-2xl border border-[var(--color-border)] p-4"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const result = await updateQuestionnaireMetaAction({
              locale,
              id: questionnaire.id,
              title,
              description,
              slug,
              status,
              visibility,
              limitOneResponse: limitOne,
              showOnLanding: showLanding,
            });
            if (!result.ok) {
              setError(metaError(result.code, labels));
              return;
            }
            setError(null);
          });
        }}
      >
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.fieldTitle}</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.fieldDescription}</span>
          <textarea
            className="min-h-24 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.fieldSlug}</span>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} disabled={slugLocked} />
          {slugLocked ? (
            <span className="mt-1 block text-xs text-[var(--color-muted-foreground)]">
              {labels.fieldSlugLocked}
            </span>
          ) : null}
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.fieldStatus}</span>
          <select
            className="w-full rounded-[var(--layout-border-radius)] border px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as QuestionnaireStatus)}
          >
            <option value="draft">{labels.statusDraft}</option>
            <option value="published">{labels.statusPublished}</option>
            <option value="closed">{labels.statusClosed}</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{labels.fieldVisibility}</span>
          <select
            className="w-full rounded-[var(--layout-border-radius)] border px-3 py-2"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as QuestionnaireVisibility)}
          >
            <option value="public">{labels.visibilityPublic}</option>
            <option value="private">{labels.visibilityPrivate}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={limitOne} onChange={(e) => setLimitOne(e.target.checked)} />
          {labels.fieldLimitOne}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showLanding} onChange={(e) => setShowLanding(e.target.checked)} />
          {labels.fieldShowLanding}
        </label>
        {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
        <Button type="submit" isLoading={pending}>
          {labels.saveMeta}
        </Button>
      </form>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{labels.questionsTitle}</h2>
        <QuestionnaireQuestionList
          locale={locale}
          questionnaireId={questionnaire.id}
          questions={questions}
          labels={labels}
        />
        <QuestionnaireQuestionAddPanel locale={locale} questionnaireId={questionnaire.id} labels={labels} />
      </section>
    </div>
  );
}

function metaError(code: string, labels: Labels): string {
  if (code === "title") return labels.errorTitle;
  if (code === "slug") return labels.errorSlug;
  if (code === "slug_taken") return labels.errorSlugTaken;
  if (code === "publish_empty") return labels.errorPublishEmpty;
  if (code === "publish_options") return labels.errorPublishOptions;
  return labels.errorSave;
}
